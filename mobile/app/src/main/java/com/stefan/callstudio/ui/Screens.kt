@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.stefan.callstudio.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.automirrored.filled.PlaylistPlay
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stefan.callstudio.AppViewModel
import com.stefan.callstudio.SearchMode
import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.CallSort
import com.stefan.callstudio.data.Filters
import com.stefan.callstudio.data.MineFilter
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.closerCountsFrom
import com.stefan.callstudio.data.filterCalls
import com.stefan.callstudio.data.formatClock
import com.stefan.callstudio.data.passes
import com.stefan.callstudio.data.searchSections
import com.stefan.callstudio.data.topSections

/** The chips under each search box: Mine / Not mine / Favourites / Closers (opens the sheet). */
@Composable
fun FilterBar(filters: Filters, onChange: (Filters) -> Unit, onOpenSheet: () -> Unit, trailing: (@Composable () -> Unit)? = null) {
    Row(
        Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        FilterChip(selected = filters.mine == MineFilter.MINE, label = { Text("Mine") },
            onClick = { onChange(filters.copy(mine = if (filters.mine == MineFilter.MINE) MineFilter.ALL else MineFilter.MINE)) })
        FilterChip(selected = filters.mine == MineFilter.OTHER, label = { Text("Not mine") },
            onClick = { onChange(filters.copy(mine = if (filters.mine == MineFilter.OTHER) MineFilter.ALL else MineFilter.OTHER)) })
        FilterChip(selected = filters.favouritesOnly, label = { Text("★ Favourites") },
            onClick = { onChange(filters.copy(favouritesOnly = !filters.favouritesOnly)) })
        FilterChip(selected = filters.closers.isNotEmpty(), onClick = onOpenSheet,
            label = { Text(if (filters.closers.isEmpty()) "Closers" else "Closers (${filters.closers.size})") },
            trailingIcon = { Icon(Icons.Filled.ArrowDropDown, contentDescription = null) })
        trailing?.invoke()
    }
}

// ============================================================================================ Calls
@Composable
fun CallsScreen(vm: AppViewModel, onOpenCall: (String) -> Unit, onPickImport: () -> Unit) {
    val lib by vm.library.collectAsState()
    val filters by vm.filters.collectAsState()
    val priority by vm.sortPriority.collectAsState()
    val favs by vm.favourites.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    var sheet by remember { mutableStateOf(false) }
    var menu by remember { mutableStateOf(false) }
    var info by remember { mutableStateOf(false) }
    var confirmClear by remember { mutableStateOf(false) }
    val isFav = { c: Call -> favs[c.name] ?: c.favourite }

    val calls = remember(lib, query, filters, priority, favs) {
        filterCalls(lib.calls, query, filters, if (priority) CallSort.PRIORITY else CallSort.NEWEST, isFav)
    }
    val counts = remember(lib, filters, favs) {
        closerCountsFrom(lib.calls.filter { it.passes(filters, isFav(it), ignoreClosers = true) }.map { it.closer })
    }

    val focus = LocalFocusManager.current
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.padding(start = 12.dp, end = 2.dp, top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            if (lib.calls.isEmpty()) {
                Text("Calls", Modifier.weight(1f).padding(start = 4.dp), fontWeight = FontWeight.Bold, fontSize = 24.sp)
            } else {
                OutlinedTextField(
                    value = query, onValueChange = { query = it }, singleLine = true,
                    placeholder = { Text("Search ${lib.calls.size} calls") },
                    trailingIcon = {
                        if (query.isNotEmpty()) IconButton(onClick = { query = "" }) { Icon(Icons.Filled.Clear, contentDescription = "Clear") }
                    },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { focus.clearFocus() }),
                    modifier = Modifier.weight(1f),
                )
            }
            Box {
                IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, contentDescription = "Menu") }
                DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                    DropdownMenuItem(text = { Text("Import library (.zip)") }, onClick = { menu = false; onPickImport() })
                    DropdownMenuItem(text = { Text("Library info and tips") }, onClick = { menu = false; info = true })
                    DropdownMenuItem(text = { Text("Remove library from phone") }, onClick = { menu = false; confirmClear = true })
                }
            }
        }
        if (lib.calls.isEmpty()) {
            EmptyLibrary(onPickImport)
        } else {
            Box(Modifier.padding(top = 4.dp)) {
                FilterBar(filters, vm::setFilters, { sheet = true }) {
                    AssistChip(onClick = { vm.setSortPriority(!priority) }, label = { Text(if (priority) "Sort: priority" else "Sort: newest") })
                }
            }
            LazyColumn(Modifier.fillMaxSize().padding(top = 4.dp)) {
                item {
                    Text(
                        if (filters.isActive || query.isNotBlank()) "${calls.size} of ${lib.calls.size} calls" else "${lib.calls.size} calls",
                        Modifier.padding(horizontal = 16.dp, vertical = 4.dp), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (calls.isEmpty()) item { EmptyState("Nothing matches", "Try clearing a filter.") }
                items(calls, key = { it.name }) { c ->
                    CallRow(c, favourite = isFav(c), hasAudio = vm.hasAudio(c), onOpen = { focus.clearFocus(); onOpenCall(c.name) }, onFavourite = { vm.toggleFavourite(c) })
                }
            }
        }
    }

    if (sheet) FilterSheet(filters, counts, vm::setFilters, onDismiss = { sheet = false })
    if (info) LibraryInfoDialog(vm, onDismiss = { info = false })
    if (confirmClear) AlertDialog(
        onDismissRequest = { confirmClear = false },
        title = { Text("Remove the library?") },
        text = { Text("This deletes the calls, audio and transcripts from this phone (your favourites and queue stay). You can import a bundle again any time.") },
        confirmButton = { TextButton(onClick = { confirmClear = false; vm.clearLibrary() }) { Text("Remove") } },
        dismissButton = { TextButton(onClick = { confirmClear = false }) { Text("Cancel") } },
    )
}

@Composable
fun EmptyLibrary(onPickImport: () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp)) {
        Text("Your library is empty", fontWeight = FontWeight.Bold, fontSize = 22.sp)
        Text(
            "Calls live on this phone, so you can listen anywhere with no signal.", Modifier.padding(top = 8.dp), lineHeight = 21.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "1. On the Mac, open Call Studio and press “📱 Export for phone”.\n" +
                "2. Move the .zip to this phone (Google Drive, USB cable, any sharing app).\n" +
                "3. Tap the zip and choose Call Studio, or press the button below.",
            Modifier.padding(top = 16.dp, bottom = 20.dp), lineHeight = 24.sp,
        )
        Button(onClick = onPickImport) { Text("Import library (.zip)") }
    }
}

@Composable
fun LibraryInfoDialog(vm: AppViewModel, onDismiss: () -> Unit) {
    val lib by vm.library.collectAsState()
    val withAudio = lib.calls.count { vm.hasAudio(it) }
    val mb = vm.store.storageBytes() / 1_000_000
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } },
        title = { Text("Library") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                Text("${lib.calls.size} calls · $withAudio with audio on this phone\nUsing $mb MB\nExported from the Mac: ${lib.generated.ifBlank { "unknown" }}")
                Text("Keep playback reliable (OPPO / ColorOS)", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 16.dp, bottom = 4.dp))
                Text(
                    "ColorOS stops background apps to save battery. Do this once so audio keeps playing with the screen off:\n" +
                        "• Settings › Battery › Call Studio › allow background activity (turn off battery optimisation)\n" +
                        "• Settings › Apps › Call Studio › allow auto-launch / run in background\n" +
                        "• In the recent-apps view, pull the Call Studio card down and tap the lock so it is never cleared.",
                    fontSize = 13.sp, lineHeight = 19.sp,
                )
            }
        },
    )
}

// ============================================================================================ Sections
@Composable
fun SectionsScreen(vm: AppViewModel, onOpenCall: (String) -> Unit) {
    val lib by vm.library.collectAsState()
    val filters by vm.filters.collectAsState()
    val favs by vm.favourites.collectAsState()
    val query by vm.sectionQuery.collectAsState()
    val mode by vm.searchMode.collectAsState()
    val wordHits by vm.wordHits.collectAsState()
    val searching by vm.searching.collectAsState()
    val player by vm.player.ui.collectAsState()
    var sheet by remember { mutableStateOf(false) }
    var expandedKey by rememberSaveable { mutableStateOf<String?>(null) }
    val isFav = { c: Call -> favs[c.name] ?: c.favourite }

    val hits = remember(lib, query, filters, favs, mode) {
        if (mode == SearchMode.SECTION) searchSections(lib.calls, query, filters, isFav) else emptyList()
    }
    val counts = remember(lib, query, filters, favs, mode) {
        if (mode == SearchMode.SECTION) {
            closerCountsFrom(searchSections(lib.calls, query, filters, isFav, ignoreClosers = true).map { it.call.closer })
        } else {
            closerCountsFrom(lib.calls.filter { it.passes(filters, isFav(it), ignoreClosers = true) }.map { it.closer })
        }
    }
    val chips = remember(lib) { topSections(lib.calls) }

    val focus = LocalFocusManager.current
    Column(Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = query,
            onValueChange = { vm.sectionQuery.value = it; if (mode == SearchMode.WORDS) vm.searchWords(it) },
            singleLine = true,
            placeholder = { Text(if (mode == SearchMode.SECTION) "Section, e.g. Desire" else "Words said in any call") },
            trailingIcon = {
                if (query.isNotEmpty()) IconButton(onClick = { vm.sectionQuery.value = ""; vm.searchWords("") }) {
                    Icon(Icons.Filled.Clear, contentDescription = "Clear")
                }
            },
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { focus.clearFocus() }),
            modifier = Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 8.dp),
        )
        // what to search in sits in the same scrolling chip row as the filters, so the header stays two rows tall
        Box(Modifier.padding(top = 6.dp)) {
            Row(
                Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically,
            ) {
                FilterChip(selected = mode == SearchMode.SECTION, label = { Text("Section") },
                    onClick = { vm.searchMode.value = SearchMode.SECTION })
                FilterChip(selected = mode == SearchMode.WORDS, label = { Text("Words") },
                    onClick = { vm.searchMode.value = SearchMode.WORDS; vm.searchWords(query) })
                androidx.compose.material3.VerticalDivider(Modifier.height(24.dp))
                FilterChip(selected = filters.closers.isNotEmpty(), onClick = { sheet = true },
                    label = { Text(if (filters.closers.isEmpty()) "Closers" else "Closers (${filters.closers.size})") },
                    trailingIcon = { Icon(Icons.Filled.ArrowDropDown, contentDescription = null) })
                FilterChip(selected = filters.mine == MineFilter.MINE, label = { Text("Mine") },
                    onClick = { vm.setFilters(filters.copy(mine = if (filters.mine == MineFilter.MINE) MineFilter.ALL else MineFilter.MINE)) })
                FilterChip(selected = filters.mine == MineFilter.OTHER, label = { Text("Not mine") },
                    onClick = { vm.setFilters(filters.copy(mine = if (filters.mine == MineFilter.OTHER) MineFilter.ALL else MineFilter.OTHER)) })
                FilterChip(selected = filters.favouritesOnly, label = { Text("★") },
                    onClick = { vm.setFilters(filters.copy(favouritesOnly = !filters.favouritesOnly)) })
            }
        }

        if (mode == SearchMode.SECTION) {
            LazyColumn(Modifier.fillMaxSize().padding(top = 4.dp)) {
                if (chips.isNotEmpty()) {
                    item {
                        LazyRow(contentPadding = PaddingValues(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(chips) { (name, n) ->
                                FilterChip(selected = query.equals(name, ignoreCase = true),
                                    onClick = { vm.sectionQuery.value = name; focus.clearFocus() },
                                    label = { Text("$name  $n", fontSize = 13.sp) })
                            }
                        }
                    }
                }
                if (query.isBlank()) {
                    item { EmptyState("Pick a section", "Tap one above or type its name. Every call that has it is listed newest first; tap ▶ to hear just that part.") }
                } else {
                    item {
                        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("${hits.size} sections", Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { vm.addAllToQueue(hits) }, enabled = hits.isNotEmpty()) {
                                Icon(Icons.AutoMirrored.Filled.PlaylistAdd, null); Text(" Queue all")
                            }
                            Button(onClick = { focus.clearFocus(); vm.playHits(hits) }, enabled = hits.isNotEmpty()) {
                                Icon(Icons.AutoMirrored.Filled.PlaylistPlay, null); Text(" Play all")
                            }
                        }
                    }
                    if (hits.isEmpty()) item { EmptyState("No sections match", "Check the spelling or relax a filter.") }
                    itemsIndexed(hits, key = { _, h -> h.key }) { _, hit ->
                        val expanded = expandedKey == hit.key
                        val lines by produceState<List<TLine>?>(null, hit.call.name, expanded) { if (expanded) value = vm.transcript(hit.call) }
                        SectionCard(
                            hit = hit, player = player, hasAudio = vm.hasAudio(hit.call), expanded = expanded, lines = lines,
                            onPlay = { focus.clearFocus(); vm.playHit(hit); expandedKey = hit.key },
                            onQueue = { vm.addToQueue(hit) },
                            onOpenCall = { onOpenCall(hit.call.name) },
                            onToggleExpand = { expandedKey = if (expanded) null else hit.key },
                            onTapLine = { l -> vm.playHitAt(hit, l.start) },
                        )
                    }
                }
            }
        } else {
            when {
                query.trim().length < 2 -> EmptyState("Search every transcript", "Type a word or phrase (2+ letters), e.g. “husband” or “what would it mean”. Tap a result to hear it.")
                searching -> EmptyState("Searching…", "")
                else -> LazyColumn(Modifier.fillMaxSize()) {
                    item {
                        Text(
                            if (wordHits.isEmpty()) "No matches" else "${wordHits.size}${if (wordHits.size >= 300) "+" else ""} lines",
                            Modifier.padding(horizontal = 16.dp, vertical = 6.dp), fontWeight = FontWeight.SemiBold,
                        )
                    }
                    items(wordHits) { h ->
                        Card(
                            Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp).clickable { focus.clearFocus(); vm.playCall(h.call, h.line.start) },
                            colors = CardDefaults.cardColors(containerColor = callTint(h.call) ?: MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                        ) {
                            Column(Modifier.padding(12.dp)) {
                                Text("${h.call.displayTitle} · ${formatClock(h.line.start)}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(marked(h.line.text, query), fontSize = 14.sp, lineHeight = 19.sp, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            }
        }
    }
    if (sheet) FilterSheet(filters, counts, vm::setFilters, onDismiss = { sheet = false })
}

// ============================================================================================ Queue
@Composable
fun QueueScreen(vm: AppViewModel) {
    val queue by vm.queue.collectAsState()
    val player by vm.player.ui.collectAsState()
    val lib by vm.library.collectAsState()
    val totalSec = queue.sumOf { if (it.endMs > it.startMs) (it.endMs - it.startMs) / 1000 else 0L }
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.padding(start = 16.dp, end = 12.dp, top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Queue", fontWeight = FontWeight.Bold, fontSize = 24.sp)
                Text(
                    if (queue.isEmpty()) "Add sections with the + button" else "${queue.size} sections · ${formatClock(totalSec.toDouble())}",
                    fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (queue.isNotEmpty()) {
                TextButton(onClick = vm::clearQueue) { Text("Clear") }
                Button(onClick = { vm.playQueue(0) }) { Icon(Icons.AutoMirrored.Filled.PlaylistPlay, null); Text(" Play") }
            }
        }
        if (queue.isEmpty()) {
            EmptyState("Nothing queued", "In Sections, tap the playlist-add icon on a result (or “Queue all”). The queue plays back to back, remembers its order, and survives closing the app.")
        } else {
            LazyColumn(Modifier.fillMaxSize().padding(top = 6.dp)) {
                itemsIndexed(queue, key = { _, q -> q.id }) { i, q ->
                    val call = lib.calls.firstOrNull { it.name == q.call }
                    val current = player.key == q.key
                    Card(
                        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp).clickable { vm.playQueue(i) },
                        colors = CardDefaults.cardColors(containerColor = (call?.let { callTint(it) }) ?: MaterialTheme.colorScheme.surface),
                        border = BorderStroke(
                            if (current) 2.dp else 1.dp,
                            if (current) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                        ),
                    ) {
                        Row(Modifier.padding(start = 14.dp, top = 6.dp, bottom = 6.dp, end = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("${i + 1}", Modifier.padding(end = 12.dp), color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                            Column(Modifier.weight(1f)) {
                                Text(q.label, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    "${call?.displayTitle ?: q.call} · ${formatClock(q.startMs / 1000.0)}–${formatClock(q.endMs / 1000.0)}",
                                    fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis,
                                )
                            }
                            IconButton(onClick = { vm.moveInQueue(q.id, -1) }, enabled = i > 0) { Icon(Icons.Filled.ArrowUpward, "Move up") }
                            IconButton(onClick = { vm.moveInQueue(q.id, 1) }, enabled = i < queue.lastIndex) { Icon(Icons.Filled.ArrowDownward, "Move down") }
                            IconButton(onClick = { vm.removeFromQueue(q.id) }) { Icon(Icons.Filled.Close, "Remove") }
                        }
                    }
                }
            }
        }
    }
}
