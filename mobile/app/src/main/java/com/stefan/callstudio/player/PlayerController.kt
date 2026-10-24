package com.stefan.callstudio.player

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.core.content.ContextCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.stefan.callstudio.data.Prefs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

/**
 * One thing to play: a section of a call ([endMs] > 0) or a whole call ([startMs] = [endMs] = 0).
 * Section items are *clipped*, so they stop at their end and a queue moves on to the next one by itself.
 */
data class PlayItem(
    val callName: String,
    val file: File,
    val startMs: Long,
    val endMs: Long,
    val label: String,
    val subtitle: String,
) {
    val key: String get() = "$callName|$startMs|$endMs"
}

/** What the UI shows. Positions are *inside the call* (not inside the clip), which is what the transcript needs. */
data class PlayerUi(
    val connected: Boolean = false,
    val hasMedia: Boolean = false,
    val key: String? = null,
    val callName: String? = null,
    val title: String = "",
    val subtitle: String = "",
    val isPlaying: Boolean = false,
    val buffering: Boolean = false,
    val absMs: Long = 0,
    val rangeStartMs: Long = 0,
    val rangeEndMs: Long = 0,        // 0 until the call's length is known (whole-call items)
    val speed: Float = 1f,
    val hasNext: Boolean = false,
    val hasPrev: Boolean = false,
    val index: Int = 0,
    val count: Int = 0,
    val sleepEndsAt: Long? = null,
    val error: String? = null,
)

class PlayerController(
    private val context: Context,
    private val prefs: Prefs,
    private val scope: CoroutineScope,
) {
    private var controller: MediaController? = null
    private val _ui = MutableStateFlow(PlayerUi(speed = prefs.speed))
    val ui: StateFlow<PlayerUi> = _ui.asStateFlow()
    private var sleepJob: Job? = null
    private var sleepEndsAt: Long? = null
    private var lastSavedAt = 0L
    private var pendingRestore: (() -> Unit)? = null
    private var error: String? = null

    fun connect() {
        if (controller != null) return
        val token = SessionToken(context, ComponentName(context, PlaybackService::class.java))
        val future = MediaController.Builder(context, token).buildAsync()
        future.addListener({
            val c = try { future.get() } catch (e: Exception) { error = "Couldn't start the player: ${e.message}"; publish(); return@addListener }
            controller = c
            c.addListener(object : Player.Listener {
                override fun onEvents(player: Player, events: Player.Events) {
                    if (events.contains(Player.EVENT_IS_PLAYING_CHANGED) || events.contains(Player.EVENT_MEDIA_ITEM_TRANSITION)) {
                        savePosition(force = true)
                    }
                    publish()
                }
                override fun onPlayerError(e: androidx.media3.common.PlaybackException) {
                    error = "Can't play this: ${e.errorCodeName}"
                    publish()
                }
            })
            c.setPlaybackSpeed(prefs.speed)
            pendingRestore?.invoke()
            pendingRestore = null
            publish()
        }, ContextCompat.getMainExecutor(context))
        scope.launch {
            while (true) {
                delay(250)
                if (controller != null) {
                    publish()
                    if (controller?.isPlaying == true) savePosition(force = false)
                }
            }
        }
    }

    // ---- reading state -------------------------------------------------------------------------------------
    private fun parseKey(key: String?): Triple<String, Long, Long>? {
        val p = key?.split("|") ?: return null
        if (p.size < 3) return null
        return Triple(p[0], p[1].toLongOrNull() ?: 0, p[2].toLongOrNull() ?: 0)
    }

    private fun publish() {
        val c = controller
        if (c == null) {
            _ui.value = _ui.value.copy(connected = false, error = error)
            return
        }
        val item = c.currentMediaItem
        val parsed = parseKey(item?.mediaId)
        val start = parsed?.second ?: 0
        val clipped = (parsed?.third ?: 0) > 0
        val relPos = c.currentPosition.coerceAtLeast(0)
        val dur = c.duration.takeIf { it != C.TIME_UNSET && it > 0 } ?: 0
        val end = if (clipped) parsed!!.third else dur
        _ui.value = PlayerUi(
            connected = true,
            hasMedia = item != null,
            key = item?.mediaId,
            callName = parsed?.first,
            title = item?.mediaMetadata?.title?.toString() ?: "",
            subtitle = item?.mediaMetadata?.artist?.toString() ?: "",
            isPlaying = c.isPlaying,
            buffering = c.playbackState == Player.STATE_BUFFERING,
            absMs = start + relPos,
            rangeStartMs = start,
            rangeEndMs = end,
            speed = c.playbackParameters.speed,
            hasNext = c.hasNextMediaItem(),
            hasPrev = c.hasPreviousMediaItem(),
            index = c.currentMediaItemIndex,
            count = c.mediaItemCount,
            sleepEndsAt = sleepEndsAt,
            error = error,
        )
    }

    private fun savePosition(force: Boolean) {
        val s = _ui.value
        val key = s.key ?: return
        val now = System.currentTimeMillis()
        if (!force && now - lastSavedAt < 5_000) return
        lastSavedAt = now
        prefs.positions = prefs.positions + (key to s.absMs)
        prefs.lastKey = key
        prefs.lastLabel = s.title + "\u0001" + s.subtitle
    }

    /** Where this item was last left, if that was somewhere in the middle (not right at the start or end). */
    fun resumePosition(item: PlayItem): Long? {
        val saved = prefs.positions[item.key] ?: return null
        val tooEarly = item.startMs + 3_000
        val tooLate = if (item.endMs > 0) item.endMs - 3_000 else Long.MAX_VALUE
        return saved.takeIf { it in tooEarly..tooLate }
    }

    // ---- actions ------------------------------------------------------------------------------------------
    private fun toMediaItem(it: PlayItem): MediaItem {
        val b = MediaItem.Builder()
            .setMediaId(it.key)
            .setUri(Uri.fromFile(it.file))
            .setMediaMetadata(MediaMetadata.Builder().setTitle(it.label).setArtist(it.subtitle).build())
        if (it.endMs > 0) {
            b.setClippingConfiguration(
                MediaItem.ClippingConfiguration.Builder().setStartPositionMs(it.startMs).setEndPositionMs(it.endMs).build()
            )
        }
        return b.build()
    }

    /** Plays [items] from item [index]; [absMs] says where inside that item's call to start (default: its start). */
    fun play(items: List<PlayItem>, index: Int = 0, absMs: Long? = null, autoPlay: Boolean = true) {
        val c = controller ?: run { pendingRestore = { play(items, index, absMs, autoPlay) }; connect(); return }
        if (items.isEmpty()) return
        error = null
        val target = items[index.coerceIn(0, items.lastIndex)]
        val rel = if (absMs != null) (absMs - target.startMs).coerceAtLeast(0) else 0L
        c.setMediaItems(items.map(::toMediaItem), index.coerceIn(0, items.lastIndex), rel)
        c.setPlaybackSpeed(prefs.speed)
        c.prepare()
        if (autoPlay) c.play()
        publish()
    }

    /** Loads the last-played item paused, so the mini player is back after the app was closed. */
    fun restoreIfEmpty(item: PlayItem, absMs: Long) {
        val action = { if ((controller?.mediaItemCount ?: 0) == 0) play(listOf(item), 0, absMs, autoPlay = false) }
        if (controller == null) { pendingRestore = action; connect() } else action()
    }

    fun toggle() {
        val c = controller ?: return
        if (c.isPlaying) c.pause() else {
            if (c.playbackState == Player.STATE_ENDED) c.seekTo(0)
            if (c.playbackState == Player.STATE_IDLE) c.prepare()
            c.play()
        }
        publish()
    }

    fun pause() { controller?.pause(); publish() }

    fun seekAbs(absMs: Long) {
        val c = controller ?: return
        val s = _ui.value
        val rel = (absMs - s.rangeStartMs).coerceAtLeast(0)
        val limit = if (s.rangeEndMs > 0) s.rangeEndMs - s.rangeStartMs else Long.MAX_VALUE
        c.seekTo(rel.coerceAtMost(limit))
        publish()
    }

    fun skip(deltaMs: Long) = seekAbs(_ui.value.absMs + deltaMs)

    fun next() { controller?.seekToNextMediaItem(); publish() }

    fun previous() {
        val c = controller ?: return
        if (c.currentPosition > 3_000 || !c.hasPreviousMediaItem()) c.seekTo(0) else c.seekToPreviousMediaItem()
        publish()
    }

    fun setSpeed(speed: Float) {
        prefs.speed = speed
        controller?.setPlaybackSpeed(speed)
        publish()
    }

    /** Pause after [minutes]; null cancels. */
    fun setSleep(minutes: Int?) {
        sleepJob?.cancel()
        sleepEndsAt = null
        if (minutes != null) {
            sleepEndsAt = System.currentTimeMillis() + minutes * 60_000L
            sleepJob = scope.launch {
                delay(minutes * 60_000L)
                controller?.pause()
                sleepEndsAt = null
                publish()
            }
        }
        publish()
    }

    fun stopAndClear() {
        controller?.run { stop(); clearMediaItems() }
        publish()
    }
}
