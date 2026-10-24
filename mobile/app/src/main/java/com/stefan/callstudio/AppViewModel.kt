package com.stefan.callstudio

import android.app.Application
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.Filters
import com.stefan.callstudio.data.ImportException
import com.stefan.callstudio.data.ImportResult
import com.stefan.callstudio.data.Importer
import com.stefan.callstudio.data.Library
import com.stefan.callstudio.data.LibraryStore
import com.stefan.callstudio.data.MineFilter
import com.stefan.callstudio.data.Prefs
import com.stefan.callstudio.data.QueueItem
import com.stefan.callstudio.data.SavedFilters
import com.stefan.callstudio.data.SectionHit
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.WordHit
import com.stefan.callstudio.data.formatClock
import com.stefan.callstudio.data.passes
import com.stefan.callstudio.data.searchLines
import com.stefan.callstudio.player.PlayItem
import com.stefan.callstudio.player.PlayerController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

sealed interface ImportUi {
    data object Idle : ImportUi
    data class Running(val fraction: Float, val message: String) : ImportUi
    data class Done(val result: ImportResult) : ImportUi
    data class Failed(val message: String) : ImportUi
}

enum class SearchMode { SECTION, WORDS }

/** Everything the screens read and every action they trigger. The library itself is read-only data. */
class AppViewModel(app: Application) : AndroidViewModel(app) {
    val store = LibraryStore(File(app.filesDir, "library"))
    val prefs = Prefs(app)
    val player = PlayerController(app, prefs, viewModelScope)

    private val _library = MutableStateFlow(store.load())
    val library: StateFlow<Library> = _library.asStateFlow()

    private val _favourites = MutableStateFlow(prefs.favourites)
    val favourites: StateFlow<Map<String, Boolean>> = _favourites.asStateFlow()

    private val _filters = MutableStateFlow(prefs.filters.toFilters())
    val filters: StateFlow<Filters> = _filters.asStateFlow()

    private val _sortPriority = MutableStateFlow(prefs.sortPriority)
    val sortPriority: StateFlow<Boolean> = _sortPriority.asStateFlow()

    private val _queue = MutableStateFlow(prefs.queue)
    val queue: StateFlow<List<QueueItem>> = _queue.asStateFlow()

    private val _import = MutableStateFlow<ImportUi>(ImportUi.Idle)
    val importState: StateFlow<ImportUi> = _import.asStateFlow()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    // cross-call search state (kept here so it survives switching tabs)
    val sectionQuery = MutableStateFlow("")
    val searchMode = MutableStateFlow(SearchMode.SECTION)
    private val _wordHits = MutableStateFlow<List<WordHit>>(emptyList())
    val wordHits: StateFlow<List<WordHit>> = _wordHits.asStateFlow()
    private val _searching = MutableStateFlow(false)
    val searching: StateFlow<Boolean> = _searching.asStateFlow()
    private var wordJob: Job? = null

    init {
        player.connect()
        restoreLast()
    }

    // ---- library -------------------------------------------------------------------------------------------
    fun isFavourite(call: Call): Boolean = _favourites.value[call.name] ?: call.favourite

    fun toggleFavourite(call: Call) {
        _favourites.value = _favourites.value + (call.name to !isFavourite(call))
        prefs.favourites = _favourites.value
    }

    fun callByName(name: String): Call? = _library.value.calls.firstOrNull { it.name == name }

    fun hasAudio(call: Call): Boolean = store.audioFile(call) != null

    suspend fun transcript(call: Call): List<TLine> = withContext(Dispatchers.IO) { store.readTranscript(call) }

    fun importUri(uri: Uri) {
        if (_import.value is ImportUi.Running) return
        _import.value = ImportUi.Running(0f, "Opening…")
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val resolver = getApplication<Application>().contentResolver
                val size = resolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use {
                    if (it.moveToFirst() && !it.isNull(0)) it.getLong(0) else -1L
                } ?: -1L
                val input = resolver.openInputStream(uri) ?: throw ImportException("Couldn't open that file.")
                val result = input.use {
                    Importer.importZip(store, it, size) { f, msg -> _import.value = ImportUi.Running(f, msg) }
                }
                _library.value = store.load()
                _import.value = ImportUi.Done(result)
                restoreLast()
            } catch (e: ImportException) {
                _import.value = ImportUi.Failed(e.message ?: "Import failed")
            } catch (e: Exception) {
                _import.value = ImportUi.Failed("Import failed: ${e.message ?: e.javaClass.simpleName}")
            }
        }
    }

    fun dismissImport() { if (_import.value !is ImportUi.Running) _import.value = ImportUi.Idle }

    fun clearLibrary() {
        player.stopAndClear()
        store.clear()
        _library.value = Library()
        _queue.value = emptyList(); prefs.queue = emptyList()
        _import.value = ImportUi.Idle
    }

    // ---- filters -------------------------------------------------------------------------------------------
    fun setFilters(f: Filters) {
        _filters.value = f
        prefs.filters = SavedFilters(f.mine.name, f.closers.toList(), f.favouritesOnly)
    }

    fun setSortPriority(on: Boolean) { _sortPriority.value = on; prefs.sortPriority = on }

    private fun SavedFilters.toFilters() =
        Filters(runCatching { MineFilter.valueOf(mine) }.getOrDefault(MineFilter.ALL), closers.toSet(), favourites)

    // ---- words search --------------------------------------------------------------------------------------
    fun searchWords(query: String) {
        wordJob?.cancel()
        val q = query.trim()
        if (q.length < 2) { _wordHits.value = emptyList(); _searching.value = false; return }
        _searching.value = true
        wordJob = viewModelScope.launch(Dispatchers.Default) {
            delay(300) // wait for the typing to settle
            val f = _filters.value
            val out = ArrayList<WordHit>()
            val calls = _library.value.calls
                .filter { c -> c.passes(f, isFavourite(c)) }
                .sortedWith(compareByDescending<Call> { it.addedDate ?: 0.0 }.thenByDescending { it.name })
            for (c in calls) {
                if (out.size >= 300) break
                searchLines(c, store.readTranscript(c), q, out, 300)
            }
            _wordHits.value = out
            _searching.value = false
        }
    }

    // ---- playing -------------------------------------------------------------------------------------------
    private fun fileOrNull(call: Call): File? {
        val f = store.audioFile(call)
        if (f == null) _messages.tryEmit("The audio for ${call.displayTitle} isn't on this phone. Import a bundle that includes audio.")
        return f
    }

    private fun sectionItem(hit: SectionHit): PlayItem? {
        val file = fileOrNull(hit.call) ?: return null
        val range = "${formatClock(hit.start)}–${formatClock(hit.end)}"
        return PlayItem(hit.call.name, file, (hit.start * 1000).toLong(), (hit.end * 1000).toLong(),
            hit.row.section ?: "Section", "${hit.call.displayTitle} · $range")
    }

    private fun queueToItem(q: QueueItem): PlayItem? {
        val call = callByName(q.call) ?: return null
        val file = store.audioFile(call) ?: return null
        val sub = if (q.endMs > 0) "${call.displayTitle} · ${formatClock(q.startMs / 1000.0)}–${formatClock(q.endMs / 1000.0)}" else call.displayTitle
        return PlayItem(call.name, file, q.startMs, q.endMs, q.label, sub)
    }

    /** Tap on a section card: the playing one toggles, any other starts (resuming where you left it). */
    fun playHit(hit: SectionHit) {
        if (player.ui.value.key == hit.key) { player.toggle(); return }
        val item = sectionItem(hit) ?: return
        player.play(listOf(item), 0, player.resumePosition(item))
    }

    /** Tap on a transcript line inside a section card: jump there and keep (or start) playing, never toggle. */
    fun playHitAt(hit: SectionHit, absSeconds: Double) {
        val s = player.ui.value
        val ms = (absSeconds * 1000).toLong()
        if (s.key != hit.key) {
            val item = sectionItem(hit) ?: return
            player.play(listOf(item), 0, ms)
        } else {
            player.seekAbs(ms)
            if (!s.isPlaying) player.toggle()
        }
    }

    /** "Play all": the whole result list as one playlist, starting at [from]. */
    fun playHits(hits: List<SectionHit>, from: Int = 0) {
        val items = hits.mapNotNull { sectionItem(it) }
        if (items.isEmpty()) return
        val startKey = hits.getOrNull(from)?.key
        val idx = items.indexOfFirst { it.key == startKey }.coerceAtLeast(0)
        player.play(items, idx, player.resumePosition(items[idx]))
    }

    /** A whole call from [atSeconds]; if that call is already loaded as a whole call this just seeks. */
    fun playCall(call: Call, atSeconds: Double? = null) {
        val key = "${call.name}|0|0"
        val s = player.ui.value
        if (s.key == key) {
            if (atSeconds != null) { player.seekAbs((atSeconds * 1000).toLong()); if (!s.isPlaying) player.toggle() }
            else player.toggle()
            return
        }
        val file = fileOrNull(call) ?: return
        val item = PlayItem(call.name, file, 0, 0, call.displayTitle, "Full call" + if (call.closer.isNotBlank()) " · ${call.closer}" else "")
        val at = if (atSeconds != null) (atSeconds * 1000).toLong() else player.resumePosition(item)
        player.play(listOf(item), 0, at)
    }

    private fun restoreLast() {
        val key = prefs.lastKey ?: return
        val parts = key.split("|")
        if (parts.size < 3) return
        val call = callByName(parts[0]) ?: return
        val file = store.audioFile(call) ?: return
        val label = (prefs.lastLabel ?: "").split("\u0001")
        val item = PlayItem(call.name, file, parts[1].toLongOrNull() ?: 0, parts[2].toLongOrNull() ?: 0,
            label.getOrNull(0)?.ifBlank { null } ?: call.displayTitle, label.getOrNull(1) ?: "")
        player.restoreIfEmpty(item, prefs.positions[key] ?: item.startMs)
    }

    // ---- queue ---------------------------------------------------------------------------------------------
    private fun saveQueue(q: List<QueueItem>) { _queue.value = q; prefs.queue = q }

    fun addToQueue(hit: SectionHit) {
        val item = QueueItem(UUID.randomUUID().toString().take(8), hit.call.name, (hit.start * 1000).toLong(),
            (hit.end * 1000).toLong(), (hit.row.section ?: "Section"))
        if (_queue.value.any { it.key == item.key }) { _messages.tryEmit("Already in your queue"); return }
        saveQueue(_queue.value + item)
        _messages.tryEmit("Added to queue (${_queue.value.size})")
    }

    fun addAllToQueue(hits: List<SectionHit>) {
        var added = 0
        val q = _queue.value.toMutableList()
        for (h in hits) {
            val item = QueueItem(UUID.randomUUID().toString().take(8), h.call.name, (h.start * 1000).toLong(),
                (h.end * 1000).toLong(), (h.row.section ?: "Section"))
            if (q.none { it.key == item.key }) { q.add(item); added++ }
        }
        saveQueue(q)
        _messages.tryEmit("Added $added to the queue (${q.size} total)")
    }

    fun removeFromQueue(id: String) = saveQueue(_queue.value.filterNot { it.id == id })

    fun moveInQueue(id: String, delta: Int) {
        val q = _queue.value.toMutableList()
        val i = q.indexOfFirst { it.id == id }
        val j = i + delta
        if (i < 0 || j !in q.indices) return
        q.add(j, q.removeAt(i))
        saveQueue(q)
    }

    fun clearQueue() = saveQueue(emptyList())

    fun playQueue(from: Int = 0) {
        val q = _queue.value
        val items = q.mapNotNull { queueToItem(it) }
        if (items.isEmpty()) { _messages.tryEmit("Nothing in the queue has audio on this phone"); return }
        val startKey = q.getOrNull(from)?.key
        val idx = items.indexOfFirst { it.key == startKey }.coerceAtLeast(0)
        player.play(items, idx, player.resumePosition(items[idx]))
    }
}
