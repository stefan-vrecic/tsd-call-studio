package com.stefan.callstudio.data

enum class MineFilter { ALL, MINE, OTHER }

/** The same filters the Mac's sidebar and search results have: Mine / Not mine, and any number of closers. */
data class Filters(
    val mine: MineFilter = MineFilter.ALL,
    val closers: Set<String> = emptySet(),
    val favouritesOnly: Boolean = false,
) {
    val isActive: Boolean get() = mine != MineFilter.ALL || closers.isNotEmpty() || favouritesOnly
    val activeCount: Int get() = (if (mine != MineFilter.ALL) 1 else 0) + closers.size + (if (favouritesOnly) 1 else 0)
}

/** Mine / Not mine are the blue / amber marks; a call marked neither way only shows under All. */
fun Call.passes(f: Filters, isFavourite: Boolean, ignoreClosers: Boolean = false): Boolean {
    when (f.mine) {
        MineFilter.MINE -> if (mine != true) return false
        MineFilter.OTHER -> if (mine != false) return false
        MineFilter.ALL -> {}
    }
    if (f.favouritesOnly && !isFavourite) return false
    if (!ignoreClosers && f.closers.isNotEmpty() && closer !in f.closers) return false
    return true
}

/** The closers from the Mac's right-click menu, so they always show (with a count of 0) even before any call has one. */
val KNOWN_CLOSERS = listOf("Alex Ives", "James Gemmell", "David Fitzpatrick", "Eoghan", "Shaun", "Alex Neilan")

/** How many times each closer appears in [closers], for the "Alex Ives (12)" checkboxes. Known closers first, then any others found. */
fun closerCountsFrom(closers: List<String>): List<Pair<String, Int>> {
    val counts = closers.filter { it.isNotBlank() }.groupingBy { it }.eachCount()
    val others = counts.keys.filter { it !in KNOWN_CLOSERS }.sorted()
    return (KNOWN_CLOSERS + others).map { it to (counts[it] ?: 0) }
}

fun closerCounts(calls: List<Call>): List<Pair<String, Int>> = closerCountsFrom(calls.map { it.closer })

/** One matching section of one call. */
data class SectionHit(val call: Call, val rowIndex: Int, val start: Double, val end: Double) {
    val row: Row get() = call.rows[rowIndex]
    val key: String get() = "${call.name}|${(start * 1000).toLong()}|${(end * 1000).toLong()}"
}

/** The Mac's rule (/api/search-section): the query is inside the section name or the section name is inside the query. */
fun searchSections(calls: List<Call>, query: String, filters: Filters, isFavourite: (Call) -> Boolean,
                   ignoreClosers: Boolean = false): List<SectionHit> {
    val q = query.trim().lowercase()
    if (q.isEmpty()) return emptyList()
    val hits = ArrayList<SectionHit>()
    for (call in calls) {
        if (!call.passes(filters, isFavourite(call), ignoreClosers)) continue
        call.rows.forEachIndexed { i, row ->
            val s = (row.section ?: "").lowercase()
            if (row.seconds != null && s.isNotEmpty() && (q in s || s in q)) {
                val (start, end) = call.sectionRange(i)
                hits.add(SectionHit(call, i, start, end))
            }
        }
    }
    // newest call first; within a call, sections in the order they happen
    return hits.sortedWith(
        compareByDescending<SectionHit> { it.call.addedDate ?: 0.0 }
            .thenByDescending { it.call.name }
            .thenBy { it.start })
}

/** The most common section names with their counts (for the quick-pick chips). */
fun topSections(calls: List<Call>, limit: Int = 24): List<Pair<String, Int>> =
    calls.flatMap { c -> c.rows.mapNotNull { it.section?.takeIf { s -> s.isNotBlank() } } }
        .groupingBy { it }.eachCount().entries
        .sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
        .take(limit).map { it.key to it.value }

enum class CallSort { NEWEST, PRIORITY }

fun filterCalls(calls: List<Call>, nameQuery: String, filters: Filters, sort: CallSort, isFavourite: (Call) -> Boolean): List<Call> {
    val q = nameQuery.trim().lowercase()
    val kept = calls.filter { c ->
        c.passes(filters, isFavourite(c)) &&
            (q.isEmpty() || c.displayTitle.lowercase().contains(q) || c.name.lowercase().contains(q) || c.highlight.lowercase().contains(q))
    }
    return when (sort) {
        CallSort.NEWEST -> kept.sortedWith(compareByDescending<Call> { it.addedDate ?: 0.0 }.thenByDescending { it.name })
        CallSort.PRIORITY -> kept.sortedWith(compareByDescending<Call> { it.priority ?: -1.0 }
            .thenByDescending { it.addedDate ?: 0.0 })
    }
}

/** A line of a transcript that matched a words search. */
data class WordHit(val call: Call, val line: TLine, val lineIndex: Int)

fun searchLines(call: Call, lines: List<TLine>, needle: String, out: MutableList<WordHit>, limit: Int) {
    val n = needle.lowercase()
    for ((i, l) in lines.withIndex()) {
        if (out.size >= limit) return
        if (l.text.lowercase().contains(n)) out.add(WordHit(call, l, i))
    }
}
