package com.stefan.callstudio

import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.CallSort
import com.stefan.callstudio.data.Codec
import com.stefan.callstudio.data.Filters
import com.stefan.callstudio.data.MineFilter
import com.stefan.callstudio.data.Row
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.activeLineIndex
import com.stefan.callstudio.data.closerCounts
import com.stefan.callstudio.data.filterCalls
import com.stefan.callstudio.data.formatClock
import com.stefan.callstudio.data.searchSections
import com.stefan.callstudio.data.sectionRange
import com.stefan.callstudio.data.topSections
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SearchTest {
    private fun call(name: String, added: Double, mine: Boolean?, closer: String = "", vararg rows: Row) =
        Call(name = name, title = name, addedDate = added, mine = mine, closer = closer, rows = rows.toList(), durationSeconds = 600.0)

    private fun row(section: String, at: Double, end: Double? = null) = Row(ts = "x", seconds = at, end = end, section = section, desc = "d")

    private val a = call("a", 100.0, true, "Alex Ives", row("Greeting", 0.0, 60.0), row("Desire", 60.0, 180.0), row("FCOI", 180.0))
    private val b = call("b", 300.0, false, "Eoghan", row("Desire", 10.0, 90.0), row("Desire", 200.0, 260.0))
    private val c = call("c", 200.0, null, "", row("desire and more", 5.0, 50.0), row("Wobble Toolkit", 50.0))
    private val calls = listOf(a, b, c)
    private val none = { _: Call -> false }

    @Test fun sectionSearchUsesTheMacsRuleBothWays() {
        // query inside section name ("des" in "Desire"), or section name inside query ("desire" in "desire please")
        assertEquals(4, searchSections(calls, "des", Filters(), none).size)
        assertEquals(3, searchSections(calls, "DESIRE please", Filters(), none).size) // "desire" rows only; "desire and more" is not inside it
        assertEquals(0, searchSections(calls, "nothing", Filters(), none).size)
        assertEquals(0, searchSections(calls, "   ", Filters(), none).size)
    }

    @Test fun newestCallFirstThenTimelineOrder() {
        val hits = searchSections(calls, "desire", Filters(), none)
        assertEquals(listOf("b", "b", "c", "a"), hits.map { it.call.name })
        assertEquals(listOf(10.0, 200.0), hits.filter { it.call.name == "b" }.map { it.start })
    }

    @Test fun mineAndNotMineFilters() {
        assertEquals(listOf("a"), searchSections(calls, "desire", Filters(mine = MineFilter.MINE), none).map { it.call.name })
        assertEquals(listOf("b", "b"), searchSections(calls, "desire", Filters(mine = MineFilter.OTHER), none).map { it.call.name })
        // a call marked neither way shows only under All
        assertTrue(searchSections(calls, "desire", Filters(), none).any { it.call.name == "c" })
        assertFalse(searchSections(calls, "desire", Filters(mine = MineFilter.MINE), none).any { it.call.name == "c" })
    }

    @Test fun closersAreMultiSelect() {
        val one = searchSections(calls, "desire", Filters(closers = setOf("Eoghan")), none)
        assertEquals(2, one.size)
        val two = searchSections(calls, "desire", Filters(closers = setOf("Eoghan", "Alex Ives")), none)
        assertEquals(3, two.size)
        // ignoreClosers gives the counts the checkboxes show
        val counts = closerCounts(searchSections(calls, "desire", Filters(closers = setOf("Eoghan")), none, ignoreClosers = true).map { it.call })
        assertEquals(1, counts.first { it.first == "Alex Ives" }.second)
        assertEquals(2, counts.first { it.first == "Eoghan" }.second)
        assertEquals(0, counts.first { it.first == "Shaun" }.second)
    }

    @Test fun favouritesFilter() {
        val fav = { x: Call -> x.name == "a" }
        assertEquals(listOf("a"), filterCalls(calls, "", Filters(favouritesOnly = true), CallSort.NEWEST, fav).map { it.name })
    }

    @Test fun sectionRangeFallsBackToNextRowThenDuration() {
        assertEquals(60.0 to 180.0, a.sectionRange(1))      // explicit end
        assertEquals(180.0 to 600.0, a.sectionRange(2))     // last row: call duration
        val d = call("d", 1.0, null, "", row("X", 10.0), row("Y", 70.0))
        assertEquals(10.0 to 70.0, d.sectionRange(0))       // no end: next row's start
    }

    @Test fun topSectionsAreCountedAndSorted() {
        val top = topSections(calls)
        assertEquals("Desire" to 3, top.first())
    }

    @Test fun callSortAndNameSearch() {
        assertEquals(listOf("b", "c", "a"), filterCalls(calls, "", Filters(), CallSort.NEWEST, none).map { it.name })
        assertEquals(listOf("c"), filterCalls(calls, "C", Filters(mine = MineFilter.ALL), CallSort.NEWEST, none).map { it.name }.filter { it == "c" })
    }

    @Test fun activeTranscriptLine() {
        val lines = listOf(TLine(0.0, 2.0, null, "a"), TLine(2.0, 5.0, null, "b"), TLine(9.0, 12.0, null, "c"))
        assertEquals(-1, activeLineIndex(lines, -1.0))
        assertEquals(0, activeLineIndex(lines, 0.0))
        assertEquals(1, activeLineIndex(lines, 4.9))
        assertEquals(1, activeLineIndex(lines, 8.0))
        assertEquals(2, activeLineIndex(lines, 100.0))
        assertEquals(-1, activeLineIndex(emptyList(), 3.0))
    }

    @Test fun transcriptJsonFromTheMacParses() {
        val lines = Codec.parseTranscript("""{"lines":[[0.0,1.0,null,"Hello."],[1.0,3.5,"Alex","Hey, it's Joe."]]}""")
        assertEquals(2, lines.size)
        assertEquals(null, lines[0].speaker)
        assertEquals("Alex", lines[1].speaker)
        assertEquals(3.5, lines[1].end, 0.0)
    }

    @Test fun clockFormatting() {
        assertEquals("0:05", formatClock(5.4))
        assertEquals("10:34", formatClock(634.0))
        assertEquals("1:02:03", formatClock(3723.0))
        assertEquals("0:00", formatClock(-3.0))
    }
}
