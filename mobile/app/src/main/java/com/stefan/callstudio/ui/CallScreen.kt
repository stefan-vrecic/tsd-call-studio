@file:OptIn(ExperimentalMaterial3Api::class)

package com.stefan.callstudio.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stefan.callstudio.AppViewModel
import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.formatClock
import com.stefan.callstudio.data.formatDate

/** One call: header, then Sections | Transcript | Review. Plays the whole call; the transcript is for this call only. */
@Composable
fun CallScreen(vm: AppViewModel, name: String, snackbar: SnackbarHostState, onBack: () -> Unit, onOpenNow: () -> Unit) {
    val lib by vm.library.collectAsState()
    val favs by vm.favourites.collectAsState()
    val player by vm.player.ui.collectAsState()
    val call = lib.calls.firstOrNull { it.name == name }
    var tab by rememberSaveable { mutableStateOf(0) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(call?.displayTitle ?: name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") } },
                actions = {
                    if (call != null) {
                        val fav = favs[call.name] ?: call.favourite
                        IconButton(onClick = { vm.toggleFavourite(call) }) {
                            Icon(if (fav) Icons.Filled.Star else Icons.Outlined.StarBorder, "Favourite",
                                tint = if (fav) Color(0xFFF59E0B) else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                },
            )
        },
        bottomBar = {
            // this screen has no tab bar under the player, so keep it clear of the gesture/navigation bar
            androidx.compose.foundation.layout.Box(
                Modifier.background(MaterialTheme.colorScheme.surfaceVariant).navigationBarsPadding(),
            ) { MiniPlayer(player, onToggle = vm.player::toggle, onNext = vm.player::next, onOpen = onOpenNow) }
        },
    ) { pad ->
        if (call == null) {
            EmptyState("Call not found", "It may have been removed from the library.", Modifier.padding(pad))
            return@Scaffold
        }
        val isThisCall = player.callName == call.name
        val absSeconds = if (isThisCall) player.absMs / 1000.0 else null
        Column(Modifier.padding(pad).fillMaxSize()) {
            Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    val sub = listOfNotNull(
                        formatDate(call.addedDate).takeIf { it.isNotBlank() },
                        call.closer.takeIf { it.isNotBlank() },
                        call.durationSeconds?.let { formatClock(it) },
                        when (call.mine) { true -> "mine"; false -> "not mine"; null -> null },
                    ).joinToString(" · ")
                    Text(sub, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (call.highlight.isNotBlank()) Text("🔥 ${call.highlight}", fontSize = 13.sp, color = Tints.highlight())
                }
                val wholePlaying = player.key == "${call.name}|0|0" && player.isPlaying
                Button(onClick = { vm.playCall(call) }, enabled = vm.hasAudio(call)) {
                    Icon(if (wholePlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow, null)
                    Text(if (wholePlaying) " Pause" else " Play call")
                }
            }
            TabRow(selectedTabIndex = tab) {
                listOf("Sections", "Transcript", "Review").forEachIndexed { i, t ->
                    Tab(selected = tab == i, onClick = { tab = i }, text = { Text(t) })
                }
            }
            when (tab) {
                0 -> TimelineTab(vm, call, absSeconds)
                1 -> TranscriptTab(vm, call, absSeconds)
                else -> ReviewTab(call)
            }
        }
    }
}

@Composable
private fun TimelineTab(vm: AppViewModel, call: Call, absSeconds: Double?) {
    val activeRow = if (absSeconds != null) call.rows.indexOfLast { (it.seconds ?: Double.MAX_VALUE) <= absSeconds } else -1
    val state = rememberLazyListState()
    LaunchedEffect(activeRow) { if (activeRow >= 0) state.animateScrollToItem(maxOf(0, activeRow - 1)) }
    LazyColumn(Modifier.fillMaxSize().padding(top = 6.dp), state = state) {
        itemsIndexed(call.rows) { i, r ->
            val active = i == activeRow
            Card(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp).clickable(enabled = r.seconds != null) { vm.playCall(call, r.seconds) },
                colors = CardDefaults.cardColors(containerColor = if (active) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface),
                border = BorderStroke(if (active) 2.dp else 1.dp, if (active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
            ) {
                Column(Modifier.padding(12.dp)) {
                    Row {
                        Text(r.section ?: "", fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                        Text(r.ts ?: "", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                    r.desc?.takeIf { it.isNotBlank() }?.let { Text(it, fontSize = 13.sp, lineHeight = 18.sp, modifier = Modifier.padding(top = 4.dp)) }
                }
            }
        }
    }
}

@Composable
private fun TranscriptTab(vm: AppViewModel, call: Call, absSeconds: Double?) {
    val lines by produceState<List<TLine>?>(null, call.name) { value = vm.transcript(call) }
    var query by rememberSaveable { mutableStateOf("") }
    var follow by rememberSaveable { mutableStateOf(true) }
    val all = lines
    if (all == null) { EmptyState("Loading…", ""); return }
    if (all.isEmpty()) { EmptyState("No transcript", "This call has no transcript in the library."); return }
    val shown = remember(all, query) { if (query.trim().length < 2) all else all.filter { it.text.contains(query.trim(), ignoreCase = true) } }
    Column(Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = query, onValueChange = { query = it }, singleLine = true, placeholder = { Text("Search this transcript") },
            trailingIcon = { if (query.isNotEmpty()) IconButton(onClick = { query = "" }) { Icon(Icons.Filled.Clear, "Clear") } },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
        )
        Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (query.trim().length >= 2) "${shown.size} matching lines" else "Follow the audio", Modifier.weight(1f), fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Switch(checked = follow, onCheckedChange = { follow = it })
        }
        TranscriptView(
            lines = shown, absSeconds = absSeconds, follow = follow && query.trim().length < 2, highlight = query,
            modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
            onTap = { l -> vm.playCall(call, l.start) },
        )
    }
}

@Composable
private fun ReviewTab(call: Call) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        if (call.primaryObjection.isNotBlank() || call.secondaryObjection.isNotBlank()) {
            Heading("OBJECTIONS")
            if (call.primaryObjection.isNotBlank()) Text("Primary: ${call.primaryObjection}", lineHeight = 20.sp)
            if (call.secondaryObjection.isNotBlank()) Text("Secondary: ${call.secondaryObjection}", lineHeight = 20.sp, modifier = Modifier.padding(top = 6.dp))
        }
        if (call.recommendations.isNotEmpty()) {
            Heading("BIGGEST RECOMMENDATIONS")
            call.recommendations.forEachIndexed { i, r -> Text("${i + 1}. $r", lineHeight = 20.sp, modifier = Modifier.padding(bottom = 8.dp)) }
        }
        if (call.followUpDate.isNotBlank() || call.followUpProcess.isNotBlank() || call.priority != null) {
            Heading("FOLLOW-UP")
            call.priority?.let { Text("Priority ${it.toInt()}") }
            if (call.followUpDate.isNotBlank()) Text(call.followUpDate, lineHeight = 20.sp)
            if (call.followUpProcess.isNotBlank()) Text(call.followUpProcess, lineHeight = 20.sp, modifier = Modifier.padding(top = 6.dp))
        }
        if (call.skipped.isNotEmpty()) {
            Heading("SCRIPT COVERAGE")
            call.skipped.forEach { s -> Text("${s.section}: ${s.status}", lineHeight = 19.sp, fontSize = 13.sp, modifier = Modifier.padding(bottom = 6.dp)) }
        }
        if (call.findings.isNotEmpty()) {
            Heading("FINDINGS")
            call.findings.forEach { Text("• $it", lineHeight = 20.sp, fontSize = 13.sp, modifier = Modifier.padding(bottom = 6.dp)) }
        }
        if (call.primaryObjection.isBlank() && call.recommendations.isEmpty() && call.skipped.isEmpty() && call.findings.isEmpty()) {
            Text("No review notes for this call.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Heading(t: String) {
    Text(t, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(top = 16.dp, bottom = 4.dp))
}
