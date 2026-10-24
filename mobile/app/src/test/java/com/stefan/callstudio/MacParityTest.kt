package com.stefan.callstudio

import com.stefan.callstudio.data.Codec
import com.stefan.callstudio.data.Filters
import com.stefan.callstudio.data.Library
import com.stefan.callstudio.data.searchSections
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File
import java.net.URLEncoder

/**
 * Optional end-to-end check against the real Mac data: set CS_PARITY_DIR to a folder holding the library.json from an
 * "Export for phone" bundle and mac_<query>.json files saved from the Mac's /api/search-section. Every query must give
 * the same sections, in the same order, as the Mac does. Skipped when the folder isn't there.
 */
class MacParityTest {
    @Test fun sectionSearchMatchesTheMacForRealData() {
        val dir = System.getenv("CS_PARITY_DIR")?.let(::File)
        assumeTrue("CS_PARITY_DIR not set", dir != null && File(dir, "library.json").isFile)
        val lib = Codec.json.decodeFromString(Library.serializer(), File(dir!!, "library.json").readText())
        val queries = dir.listFiles { f -> f.name.startsWith("mac_") }!!.sorted()
        assumeTrue(queries.isNotEmpty())
        var total = 0
        for (f in queries) {
            val q = java.net.URLDecoder.decode(f.name.removePrefix("mac_").removeSuffix(".json"), "UTF-8")
            val mac = Codec.json.parseToJsonElement(f.readText()) as JsonArray
            val ours = searchSections(lib.calls, q, Filters(), { false })
            assertEquals("count for '$q'", mac.size, ours.size)
            mac.forEachIndexed { i, el ->
                val o: JsonObject = el.jsonObject
                val hit = ours[i]
                assertEquals("person #$i of '$q'", o["person"]!!.jsonPrimitive.content, hit.call.name)
                assertEquals("start #$i of '$q'", o["seconds"]!!.jsonPrimitive.doubleOrNull ?: 0.0, hit.start, 0.001)
                val macEnd = o["end_seconds"]?.jsonPrimitive?.doubleOrNull
                if (macEnd != null) assertEquals("end #$i of '$q'", macEnd, hit.end, 0.001)
                assertEquals("section #$i of '$q'", o["section"]!!.jsonPrimitive.content, hit.row.section)
            }
            total += mac.size
        }
        println("parity: ${queries.size} queries, $total matching sections identical to the Mac")
    }
}
