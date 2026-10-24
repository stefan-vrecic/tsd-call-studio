@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.stefan.callstudio.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stefan.callstudio.AppViewModel
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.formatClock

private val SPEEDS = listOf(1f, 1.25f, 1.5f, 1.75f, 2f, 2.5f)
private val SLEEP_MINUTES = listOf(15, 30, 60)

/** The full player: big seek bar, transport, speed, sleep timer, and the transcript of what is playing right now. */
@Composable
fun NowPlayingSheet(vm: AppViewModel, onDismiss: () -> Unit, onOpenCall: (String) -> Unit) {
    val ui by vm.player.ui.collectAsState()
    var drag by remember { mutableStateOf<Float?>(null) }
    val span = (ui.rangeEndMs - ui.rangeStartMs).coerceAtLeast(1)
    val fraction = drag ?: ((ui.absMs - ui.rangeStartMs).toFloat() / span).coerceIn(0f, 1f)
    val lines by produceState<List<TLine>>(emptyList(), ui.callName) {
        value = ui.callName?.let { n -> vm.callByName(n)?.let { vm.transcript(it) } } ?: emptyList()
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(ui.title, fontWeight = FontWeight.Bold, fontSize = 20.sp, maxLines = 2)
                    Text(ui.subtitle, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                }
                ui.callName?.let { n ->
                    IconButton(onClick = { onDismiss(); onOpenCall(n) }) { Icon(Icons.AutoMirrored.Filled.OpenInNew, "Open the call") }
                }
            }
            Slider(
                value = fraction,
                onValueChange = { drag = it },
                onValueChangeFinished = { drag?.let { vm.player.seekAbs(ui.rangeStartMs + (it * span).toLong()) }; drag = null },
                modifier = Modifier.padding(top = 8.dp),
            )
            Row(Modifier.fillMaxWidth()) {
                Text(formatClock(fraction * span / 1000.0), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("in call ${formatClock(ui.absMs / 1000.0)}", Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(if (ui.rangeEndMs > 0) formatClock(span / 1000.0) else "--:--", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = vm.player::previous) { Icon(Icons.Filled.SkipPrevious, "Previous", Modifier.size(32.dp)) }
                IconButton(onClick = { vm.player.skip(-10_000) }) { Icon(Icons.Filled.Replay10, "Back 10 seconds", Modifier.size(32.dp)) }
                PlayCircle(playing = ui.isPlaying, size = 64, onClick = vm.player::toggle)
                IconButton(onClick = { vm.player.skip(10_000) }) { Icon(Icons.Filled.Forward10, "Forward 10 seconds", Modifier.size(32.dp)) }
                IconButton(onClick = vm.player::next, enabled = ui.hasNext) { Icon(Icons.Filled.SkipNext, "Next", Modifier.size(32.dp)) }
            }
            if (ui.count > 1) {
                Text("Item ${ui.index + 1} of ${ui.count}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            }
            FlowRow(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SPEEDS.forEach { s ->
                    FilterChip(selected = kotlin.math.abs(ui.speed - s) < 0.01f, onClick = { vm.player.setSpeed(s) },
                        label = { Text(if (s == s.toInt().toFloat()) "${s.toInt()}x" else "${s}x") })
                }
            }
            FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.Center) {
                val remainingMin = ui.sleepEndsAt?.let { ((it - System.currentTimeMillis()) / 60_000 + 1).coerceAtLeast(1) }
                Text("Sleep timer", Modifier.padding(top = 10.dp, end = 4.dp), fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                SLEEP_MINUTES.forEach { m ->
                    FilterChip(selected = false, onClick = { vm.player.setSleep(m) }, label = { Text("$m min") })
                }
                if (remainingMin != null) TextButton(onClick = { vm.player.setSleep(null) }) { Text("Stop in ~$remainingMin min · cancel") }
            }
            ui.error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp)) }
            if (lines.isNotEmpty()) {
                Text("Transcript", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 12.dp, bottom = 4.dp))
                TranscriptView(
                    lines = lines, absSeconds = ui.absMs / 1000.0, follow = true,
                    modifier = Modifier.fillMaxWidth().height(190.dp),
                    onTap = { l -> vm.player.seekAbs((l.start * 1000).toLong()) },
                )
            }
        }
    }
}
