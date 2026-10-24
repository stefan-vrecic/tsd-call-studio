package com.stefan.callstudio.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive

/** One timeline entry of a call: where a section starts, which section it is, and what happens in it. */
@Serializable
data class Row(
    val ts: String? = null,
    val seconds: Double? = null,
    val end: Double? = null,
    val section: String? = null,
    val desc: String? = null,
)

@Serializable
data class Skipped(val section: String? = null, val status: String? = null)

/** One call, exactly as the Mac's "Export for phone" writes it into library.json (see phone_bundle.py). */
@Serializable
data class Call(
    val name: String,
    val title: String = "",
    val audio: String? = null,
    val durationSeconds: Double? = null,
    val addedDate: Double? = null,
    val mine: Boolean? = null,
    val favourite: Boolean = false,
    val closer: String = "",
    val highlight: String = "",
    val priority: Double? = null,
    val saleClosed: Boolean? = null,
    val primaryObjection: String = "",
    val secondaryObjection: String = "",
    val followUpDate: String = "",
    val followUpProcess: String = "",
    val recommendations: List<String> = emptyList(),
    val findings: List<String> = emptyList(),
    val skipped: List<Skipped> = emptyList(),
    val rows: List<Row> = emptyList(),
    val transcript: String? = null,
) {
    val displayTitle: String get() = title.ifBlank { name }
}

@Serializable
data class Library(
    val version: Int = 1,
    val generated: String = "",
    val audioIncluded: Boolean = true,
    val calls: List<Call> = emptyList(),
)

data class TLine(val start: Double, val end: Double, val speaker: String?, val text: String)

object Codec {
    val json = Json { ignoreUnknownKeys = true; coerceInputValues = true; encodeDefaults = true; isLenient = true }

    /** transcripts/<call>.json is {"lines": [[start, end, speaker|null, text], ...]} -- compact on purpose. */
    fun parseTranscript(text: String): List<TLine> {
        val root = json.parseToJsonElement(text) as? JsonObject ?: return emptyList()
        val lines = root["lines"] as? JsonArray ?: return emptyList()
        return lines.mapNotNull { el ->
            val a = el.jsonArray
            if (a.size < 4) return@mapNotNull null
            val start = a[0].jsonPrimitive.doubleOrNull ?: return@mapNotNull null
            val end = a[1].jsonPrimitive.doubleOrNull ?: start
            val speaker = if (a[2] is JsonNull) null else a[2].jsonPrimitive.contentOrNull
            TLine(start, end, speaker, a[3].jsonPrimitive.contentOrNull ?: "")
        }
    }
}

/** The part of a call a section covers, in seconds. `end` falls back to the next section's start, then the call's end. */
fun Call.sectionRange(index: Int): Pair<Double, Double> {
    val row = rows[index]
    val start = row.seconds ?: 0.0
    val next = rows.drop(index + 1).firstNotNullOfOrNull { it.seconds }
    val end = row.end ?: next ?: durationSeconds ?: (start + 60.0)
    return start to maxOf(end, start + 1.0)
}

fun formatClock(seconds: Double): String {
    val total = seconds.toLong().coerceAtLeast(0)
    val h = total / 3600
    val m = (total % 3600) / 60
    val s = total % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%d:%02d".format(m, s)
}

fun formatDate(epochSeconds: Double?): String {
    if (epochSeconds == null || epochSeconds <= 0) return ""
    val cal = java.util.Calendar.getInstance().apply { timeInMillis = (epochSeconds * 1000).toLong() }
    return "%d/%d/%02d".format(cal.get(java.util.Calendar.DAY_OF_MONTH), cal.get(java.util.Calendar.MONTH) + 1,
        cal.get(java.util.Calendar.YEAR) % 100)
}

/** Index of the transcript line being spoken at [seconds] (the last one that has started), or -1 before the first. */
fun activeLineIndex(lines: List<TLine>, seconds: Double): Int {
    var lo = 0
    var hi = lines.size - 1
    var ans = -1
    while (lo <= hi) {
        val mid = (lo + hi) ushr 1
        if (lines[mid].start <= seconds) { ans = mid; lo = mid + 1 } else hi = mid - 1
    }
    return ans
}
