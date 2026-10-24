package com.stefan.callstudio.data

import java.io.File

/**
 * The phone's copy of the library, all inside the app's private folder (so no storage permission is needed):
 *   library.json, audio/<call>.<ext>, transcripts/<call>.json
 * Writes go to a temp file first and are renamed, so a crash mid-write never leaves a half-written library.
 */
class LibraryStore(val root: File) {
    val audioDir = File(root, "audio")
    val transcriptDir = File(root, "transcripts")
    private val libraryFile = File(root, "library.json")

    // the last few transcripts opened, so scrubbing around one call doesn't re-parse it every time
    private val transcriptCache = object : LinkedHashMap<String, List<TLine>>(8, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, List<TLine>>?) = size > 6
    }

    init {
        audioDir.mkdirs()
        transcriptDir.mkdirs()
    }

    fun load(): Library =
        try {
            if (libraryFile.exists()) Codec.json.decodeFromString(Library.serializer(), libraryFile.readText()) else Library()
        } catch (e: Exception) {
            Library()
        }

    fun save(library: Library) {
        val tmp = File(root, "library.json.tmp")
        tmp.writeText(Codec.json.encodeToString(Library.serializer(), library))
        if (!tmp.renameTo(libraryFile)) {
            libraryFile.delete()
            check(tmp.renameTo(libraryFile)) { "couldn't write library.json" }
        }
    }

    fun audioFileName(call: Call): String = File(call.audio ?: "${call.name}.mp3").name

    /** The recording on this phone, or null if the library was imported without audio. */
    fun audioFile(call: Call): File? = File(audioDir, audioFileName(call)).takeIf { it.isFile && it.length() > 0 }

    fun transcriptFile(call: Call): File = File(transcriptDir, File(call.transcript ?: "${call.name}.json").name)

    @Synchronized
    fun readTranscript(call: Call): List<TLine> {
        transcriptCache[call.name]?.let { return it }
        val f = transcriptFile(call)
        val lines = if (f.isFile) try { Codec.parseTranscript(f.readText()) } catch (e: Exception) { emptyList() } else emptyList()
        transcriptCache[call.name] = lines
        return lines
    }

    @Synchronized
    fun dropTranscriptCache() = transcriptCache.clear()

    fun storageBytes(): Long = root.walkTopDown().filter { it.isFile }.sumOf { it.length() }

    fun clear() {
        dropTranscriptCache()
        root.deleteRecursively()
        audioDir.mkdirs()
        transcriptDir.mkdirs()
    }
}
