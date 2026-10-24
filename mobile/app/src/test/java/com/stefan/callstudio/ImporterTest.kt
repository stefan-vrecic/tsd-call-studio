package com.stefan.callstudio

import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.ImportException
import com.stefan.callstudio.data.Importer
import com.stefan.callstudio.data.LibraryStore
import com.stefan.callstudio.data.Row
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ImporterTest {
    private lateinit var dir: File
    private lateinit var store: LibraryStore

    @Before fun setUp() {
        dir = Files.createTempDirectory("cs-test").toFile()
        store = LibraryStore(dir)
    }

    @After fun tearDown() { dir.deleteRecursively() }

    private fun libraryJson(vararg names: String, generated: String = "g1") =
        """{"version":1,"generated":"$generated","audioIncluded":true,"calls":[${names.joinToString(",") {
            """{"name":"$it","title":"T $it","audio":"audio/$it.mp3","rows":[{"ts":"0:00","seconds":0,"section":"Greeting","desc":"d"}],"transcript":"transcripts/$it.json"}"""
        }}]}"""

    private fun zip(libJson: String?, audio: Map<String, ByteArray> = emptyMap(), transcripts: Map<String, String> = emptyMap(), evil: Boolean = false): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { z ->
            audio.forEach { (n, b) -> z.putNextEntry(ZipEntry("audio/$n")); z.write(b); z.closeEntry() }
            transcripts.forEach { (n, t) -> z.putNextEntry(ZipEntry("transcripts/$n")); z.write(t.toByteArray()); z.closeEntry() }
            if (evil) { z.putNextEntry(ZipEntry("audio/../../escape.mp3")); z.write(byteArrayOf(1)); z.closeEntry() }
            if (libJson != null) { z.putNextEntry(ZipEntry("library.json")); z.write(libJson.toByteArray()); z.closeEntry() }
        }
        return out.toByteArray()
    }

    /** Like the Mac's export: audio stored with its size in the header (fast skip path). */
    private fun zipStored(libJson: String, audio: Map<String, ByteArray>): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { z ->
            audio.forEach { (n, b) ->
                val e = ZipEntry("audio/$n")
                e.method = ZipEntry.STORED; e.size = b.size.toLong(); e.compressedSize = b.size.toLong()
                e.crc = java.util.zip.CRC32().also { it.update(b) }.value
                z.putNextEntry(e); z.write(b); z.closeEntry()
            }
            z.putNextEntry(ZipEntry("library.json")); z.write(libJson.toByteArray()); z.closeEntry()
        }
        return out.toByteArray()
    }

    private fun import(bytes: ByteArray) = Importer.importZip(store, ByteArrayInputStream(bytes), bytes.size.toLong()) { _, _ -> }

    @Test fun importsCallsAudioAndTranscripts() {
        val r = import(zip(libraryJson("a", "b"), mapOf("a.mp3" to ByteArray(1000) { 1 }, "b.mp3" to ByteArray(2000) { 2 }),
            mapOf("a.json" to """{"lines":[[0,1,null,"hi"]]}""")))
        assertEquals(2, r.calls); assertEquals(2, r.newCalls); assertEquals(2, r.audioCopied); assertEquals(0, r.audioSkipped)
        val lib = store.load()
        assertEquals(listOf("a", "b"), lib.calls.map { it.name })
        assertNotNull(store.audioFile(lib.calls[0])); assertEquals(2000, store.audioFile(lib.calls[1])!!.length())
        assertEquals("hi", store.readTranscript(lib.calls[0]).first().text)
        assertTrue(store.readTranscript(lib.calls[1]).isEmpty())
    }

    @Test fun secondImportSkipsAudioAlreadyHereAndMerges() {
        import(zip(libraryJson("a", "b"), mapOf("a.mp3" to ByteArray(1000), "b.mp3" to ByteArray(2000))))
        // new bundle: a unchanged (same size), b changed size, c new; "d" never mentioned stays out
        val r = import(zip(libraryJson("a", "b", "c", generated = "g2"),
            mapOf("a.mp3" to ByteArray(1000), "b.mp3" to ByteArray(2500), "c.mp3" to ByteArray(10))))
        assertEquals(3, r.calls); assertEquals(1, r.newCalls); assertEquals(2, r.audioCopied); assertEquals(1, r.audioSkipped)
        assertEquals(listOf("a", "b", "c"), store.load().calls.map { it.name })
        assertEquals(2500, File(store.audioDir, "b.mp3").length())
        assertEquals("g2", store.load().generated)
    }

    @Test fun sizesKnownUpFrontSkipWithoutCopying() {
        import(zipStored(libraryJson("a", "b"), mapOf("a.mp3" to ByteArray(1000), "b.mp3" to ByteArray(2000))))
        val r = import(zipStored(libraryJson("a", "b"), mapOf("a.mp3" to ByteArray(1000), "b.mp3" to ByteArray(2000))))
        assertEquals(0, r.audioCopied); assertEquals(2, r.audioSkipped)
    }

    @Test fun infoOnlyBundleKeepsExistingAudioAndUpdatesCalls() {
        import(zip(libraryJson("a"), mapOf("a.mp3" to ByteArray(500))))
        val updated = libraryJson("a").replace("\"title\":\"T a\"", "\"title\":\"Renamed\"")
        val r = import(zip(updated))
        assertEquals(0, r.audioCopied)
        assertEquals("Renamed", store.load().calls.single().title)
        assertNotNull(store.audioFile(store.load().calls.single()))
    }

    @Test fun partialBundleKeepsCallsItDoesNotMention() {
        import(zip(libraryJson("a", "b")))
        import(zip(libraryJson("c")))
        assertEquals(listOf("a", "b", "c"), store.load().calls.map { it.name })
    }

    @Test fun notALibraryIsRejectedWithAClearMessage() {
        try { import(zip(null, mapOf("a.mp3" to ByteArray(3)))); fail("should have thrown") }
        catch (e: ImportException) { assertTrue(e.message!!.contains("library.json")) }
    }

    @Test fun newerBundleVersionIsRejected() {
        try { import(zip(libraryJson("a").replace("\"version\":1", "\"version\":2"))); fail() }
        catch (e: ImportException) { assertTrue(e.message!!.contains("newer")) }
    }

    @Test fun pathTricksStayInsideTheLibraryFolder() {
        import(zip(libraryJson("a"), mapOf("a.mp3" to ByteArray(5)), evil = true))
        assertFalse(File(dir.parentFile, "escape.mp3").exists())
        assertFalse(File(dir, "../escape.mp3").exists() && File(dir, "../escape.mp3").canonicalFile.parentFile != dir.canonicalFile.resolve("audio"))
    }

    @Test fun missingAudioIsReportedAsMissing() {
        import(zip(libraryJson("a")))
        assertNull(store.audioFile(store.load().calls.single()))
    }

    @Test fun clearEmptiesTheLibrary() {
        import(zip(libraryJson("a"), mapOf("a.mp3" to ByteArray(5))))
        store.clear()
        assertTrue(store.load().calls.isEmpty())
        assertEquals(0L, store.storageBytes())
    }
}
