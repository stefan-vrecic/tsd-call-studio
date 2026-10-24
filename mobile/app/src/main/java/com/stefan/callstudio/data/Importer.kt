package com.stefan.callstudio.data

import java.io.BufferedInputStream
import java.io.File
import java.io.FilterInputStream
import java.io.InputStream
import java.util.zip.ZipInputStream

data class ImportResult(val calls: Int, val newCalls: Int, val audioCopied: Int, val audioSkipped: Int, val bytes: Long)

class ImportException(message: String) : Exception(message)

/**
 * Reads a library bundle zip (made by the Mac's "Export for phone") straight from the stream, so a multi-GB file
 * never has to fit in memory or be copied somewhere first. Audio already on the phone with the same size is skipped.
 * library.json comes last in the zip; it is merged into what's already here (calls in the bundle replace calls of the
 * same name, calls that aren't in the bundle stay).
 */
object Importer {
    private class Counting(input: InputStream) : FilterInputStream(input) {
        var count = 0L
        override fun read(): Int = super.read().also { if (it >= 0) count++ }
        override fun read(b: ByteArray, off: Int, len: Int): Int = super.read(b, off, len).also { if (it > 0) count += it }
    }

    fun importZip(store: LibraryStore, input: InputStream, totalBytes: Long, onProgress: (Float, String) -> Unit): ImportResult {
        val counting = Counting(BufferedInputStream(input, 1 shl 20))
        val zip = ZipInputStream(counting)
        var library: Library? = null
        var copied = 0
        var skipped = 0
        val buffer = ByteArray(256 * 1024)
        var lastReport = 0L

        fun report(message: String) {
            val now = System.currentTimeMillis()
            if (now - lastReport < 150) return
            lastReport = now
            onProgress(if (totalBytes > 0) (counting.count.toFloat() / totalBytes).coerceIn(0f, 1f) else 0f, message)
        }

        zip.use {
            while (true) {
                val entry = zip.nextEntry ?: break
                if (entry.isDirectory) continue
                val base = File(entry.name).name
                if (base.isBlank() || base == "..") continue
                when {
                    entry.name == "library.json" ->
                        library = try {
                            Codec.json.decodeFromString(Library.serializer(), zip.readBytes().toString(Charsets.UTF_8))
                        } catch (e: Exception) {
                            throw ImportException("library.json in this zip couldn't be read: ${e.message}")
                        }
                    entry.name.startsWith("audio/") -> {
                        val dest = File(store.audioDir, base)
                        val sizeKnown = entry.size >= 0 // read it now: ZipInputStream fills it in after reading the entry
                        if (dest.isFile && sizeKnown && dest.length() == entry.size) {
                            // fast path: the zip tells us the size up front (zips made by the Mac's export do)
                            skipped++
                            report("Already on the phone: $base")
                        } else {
                            val part = File(store.audioDir, "$base.part")
                            part.outputStream().buffered(1 shl 20).use { out ->
                                while (true) {
                                    val n = zip.read(buffer)
                                    if (n < 0) break
                                    out.write(buffer, 0, n)
                                    report("Copying $base")
                                }
                            }
                            if (dest.isFile && dest.length() == part.length() && !sizeKnown) {
                                // zips from other tools only reveal the size after reading: same size = same file, keep ours
                                part.delete()
                                skipped++
                            } else {
                                dest.delete()
                                if (!part.renameTo(dest)) throw ImportException("couldn't save $base")
                                copied++
                            }
                        }
                    }
                    entry.name.startsWith("transcripts/") -> {
                        File(store.transcriptDir, base).writeBytes(zip.readBytes())
                        report("Reading $base")
                    }
                }
            }
        }
        val incoming = library ?: throw ImportException("This zip isn't a Call Studio library (no library.json inside).")
        if (incoming.version > 1) throw ImportException("This library was made by a newer Call Studio. Update the phone app first.")

        val merged = LinkedHashMap<String, Call>()
        val before = store.load().calls
        before.forEach { merged[it.name] = it }
        incoming.calls.forEach { merged[it.name] = it }
        store.dropTranscriptCache()
        store.save(Library(version = 1, generated = incoming.generated, audioIncluded = incoming.audioIncluded, calls = merged.values.toList()))
        onProgress(1f, "Done")
        val existing = before.map { it.name }.toSet()
        return ImportResult(incoming.calls.size, incoming.calls.count { it.name !in existing }, copied, skipped, counting.count)
    }
}
