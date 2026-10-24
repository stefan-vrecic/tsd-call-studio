@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.stefan.callstudio.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stefan.callstudio.data.Call
import com.stefan.callstudio.data.Filters
import com.stefan.callstudio.data.MineFilter
import com.stefan.callstudio.data.SectionHit
import com.stefan.callstudio.data.TLine
import com.stefan.callstudio.data.activeLineIndex
import com.stefan.callstudio.data.formatClock
import com.stefan.callstudio.data.formatDate
import com.stefan.callstudio.player.PlayerUi

/** Which tint a call gets: blue = mine, amber = someone else's, none = not marked. */
@Composable
fun callTint(call: Call): Color? = when (call.mine) {
    true -> Tints.mine()
    false -> Tints.other()
    null -> null
}

@Composable
fun PlayCircle(playing: Boolean, enabled: Boolean = true, size: Int = 44, onClick: () -> Unit) {
    FilledIconButton(onClick = onClick, enabled = enabled, modifier = Modifier.size(size.dp)) {
        Icon(if (playing) Icons.Filled.Pause else Icons.Filled.PlayArrow, contentDescription = if (playing) "Pause" else "Play")
    }
}

/** A transcript that follows the audio. Only ever shown for the ONE thing that is playing / open. */
@Composable
fun TranscriptView(
    lines: List<TLine>,
    absSeconds: Double?,
    follow: Boolean,
    modifier: Modifier = Modifier,
    highlight: String = "",
    onTap: (TLine) -> Unit,
) {
    val active = if (absSeconds != null) activeLineIndex(lines, absSeconds) else -1
    val state = rememberLazyListState()
    LaunchedEffect(active, follow) {
        if (follow && active >= 0) state.animateScrollToItem((active - 1).coerceAtLeast(0))
    }
    LazyColumn(state = state, modifier = modifier) {
        itemsIndexed(lines) { i, l ->
            val isActive = i == active
            Row(
                Modifier.fillMaxWidth()
                    .background(if (isActive) MaterialTheme.colorScheme.primaryContainer else Color.Transparent, RoundedCornerShape(6.dp))
                    .clickable { onTap(l) }
                    .padding(horizontal = 6.dp, vertical = 5.dp),
            ) {
                Text(formatClock(l.start), color = MaterialTheme.colorScheme.primary, fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(end = 8.dp, top = 2.dp))
                Text(
                    marked(l.text, highlight),
                    fontSize = 14.sp, lineHeight = 19.sp,
                    fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isActive) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }
}

fun marked(text: String, needle: String): AnnotatedString {
    val n = needle.trim()
    if (n.length < 2) return AnnotatedString(text)
    return buildAnnotatedString {
        var i = 0
        val lower = text.lowercase()
        val q = n.lowercase()
        while (i < text.length) {
            val at = lower.indexOf(q, i)
            if (at < 0) { append(text.substring(i)); break }
            append(text.substring(i, at))
            withStyle(SpanStyle(background = Color(0xFFFDE047), color = Color.Black)) { append(text.substring(at, at + q.length)) }
            i = at + q.length
        }
    }
}

/** One result of a section search. */
@Composable
fun SectionCard(
    hit: SectionHit,
    player: PlayerUi,
    hasAudio: Boolean,
    expanded: Boolean,
    lines: List<TLine>?,
    onPlay: () -> Unit,
    onQueue: () -> Unit,
    onOpenCall: () -> Unit,
    onToggleExpand: () -> Unit,
    onTapLine: (TLine) -> Unit,
) {
    val isCurrent = player.key == hit.key
    val playing = isCurrent && player.isPlaying
    val tint = callTint(hit.call)
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 5.dp),
        colors = CardDefaults.cardColors(containerColor = tint ?: MaterialTheme.colorScheme.surface),
        border = BorderStroke(if (isCurrent) 2.dp else 1.dp, if (isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                PlayCircle(playing, enabled = hasAudio, onClick = onPlay)
                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                    Text(hit.call.displayTitle, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    val sub = listOfNotNull(
                        hit.row.section,
                        hit.call.closer.takeIf { it.isNotBlank() },
                        formatDate(hit.call.addedDate).takeIf { it.isNotBlank() },
                    ).joinToString(" · ")
                    Text(sub, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("${formatClock(hit.start)}–${formatClock(hit.end)}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.primary)
                    Text(formatClock(hit.end - hit.start), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (!hasAudio) {
                Text("Audio isn't on this phone", fontSize = 12.sp, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 6.dp))
            }
            if (isCurrent) {
                val span = (hit.end - hit.start) * 1000
                LinearProgressIndicator(
                    progress = { if (span > 0) ((player.absMs - hit.start * 1000) / span).toFloat().coerceIn(0f, 1f) else 0f },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
            }
            hit.row.desc?.takeIf { it.isNotBlank() }?.let {
                Text(it, fontSize = 13.sp, lineHeight = 18.sp, modifier = Modifier.padding(top = 8.dp).clickable(onClick = onToggleExpand),
                    maxLines = if (expanded) 4 else 3, overflow = TextOverflow.Ellipsis)
            }
            Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onToggleExpand) { Text(if (expanded) "Hide transcript" else "Transcript") }
                IconButton(onClick = onQueue) { Icon(Icons.AutoMirrored.Filled.PlaylistAdd, contentDescription = "Add to queue") }
                IconButton(onClick = onOpenCall) { Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = "Open the call") }
            }
            if (expanded) {
                HorizontalDivider(Modifier.padding(vertical = 4.dp))
                if (lines == null) {
                    Text("Loading…", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    val section = lines.filter { it.end > hit.start && it.start < hit.end }
                    if (section.isEmpty()) {
                        Text("No transcript for this part.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        TranscriptView(section, if (isCurrent) player.absMs / 1000.0 else null, follow = isCurrent,
                            modifier = Modifier.fillMaxWidth().height(230.dp), onTap = onTapLine)
                    }
                }
            }
        }
    }
}

/** One call in the Calls list. */
@Composable
fun CallRow(call: Call, favourite: Boolean, hasAudio: Boolean, onOpen: () -> Unit, onFavourite: () -> Unit) {
    val tint = callTint(call)
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 5.dp).clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(containerColor = tint ?: MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Row(Modifier.padding(start = 14.dp, top = 8.dp, bottom = 8.dp, end = 2.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(call.displayTitle, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                val sub = listOfNotNull(
                    formatDate(call.addedDate).takeIf { it.isNotBlank() },
                    call.closer.takeIf { it.isNotBlank() },
                    call.durationSeconds?.let { formatClock(it) },
                    call.priority?.let { "priority ${it.toInt()}" },
                ).joinToString(" · ")
                Text(sub, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (call.highlight.isNotBlank()) {
                    Text("🔥 ${call.highlight}", fontSize = 13.sp, color = Tints.highlight(), maxLines = 2, overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(top = 3.dp))
                }
                if (!hasAudio) Text("No audio on this phone", fontSize = 11.sp, color = MaterialTheme.colorScheme.error)
            }
            if (call.saleClosed == true) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Sale closed", tint = Color(0xFF16A34A), modifier = Modifier.size(20.dp))
            }
            IconButton(onClick = onFavourite) {
                Icon(if (favourite) Icons.Filled.Star else Icons.Outlined.StarBorder, contentDescription = "Favourite",
                    tint = if (favourite) Color(0xFFF59E0B) else MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

/** Bottom sheet with the filters: Mine / Not mine, favourites, and a checkbox per closer with how many calls they have. */
@Composable
fun FilterSheet(filters: Filters, closerCounts: List<Pair<String, Int>>, onChange: (Filters) -> Unit, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp)) {
            Text("Filter", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(Modifier.height(12.dp))
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                val options = listOf(MineFilter.ALL to "All", MineFilter.MINE to "Mine", MineFilter.OTHER to "Not mine")
                options.forEachIndexed { i, (value, label) ->
                    SegmentedButton(
                        selected = filters.mine == value,
                        onClick = { onChange(filters.copy(mine = value)) },
                        shape = SegmentedButtonDefaults.itemShape(i, options.size),
                    ) { Text(label) }
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Favourites only", Modifier.weight(1f), fontSize = 15.sp)
                Switch(checked = filters.favouritesOnly, onCheckedChange = { onChange(filters.copy(favouritesOnly = it)) })
            }
            Text("Closer", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 14.dp, bottom = 2.dp))
            closerCounts.forEach { (name, count) ->
                val checked = name in filters.closers
                Row(
                    Modifier.fillMaxWidth().clickable { onChange(filters.copy(closers = if (checked) filters.closers - name else filters.closers + name)) },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Checkbox(checked = checked, onCheckedChange = null, modifier = Modifier.padding(12.dp))
                    Text("$name ($count)", fontSize = 16.sp,
                        color = if (count == 0 && !checked) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface)
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = { onChange(Filters()) }, modifier = Modifier.weight(1f), enabled = filters.isActive) { Text("Clear all") }
                Button(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Done") }
            }
        }
    }
}

/** The slim player above the tabs. Tap it for the full player. */
@Composable
fun MiniPlayer(player: PlayerUi, onToggle: () -> Unit, onNext: () -> Unit, onOpen: () -> Unit) {
    if (!player.hasMedia) return
    Surface(tonalElevation = 6.dp, shadowElevation = 6.dp, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(Modifier.clickable(onClick = onOpen)) {
            val span = (player.rangeEndMs - player.rangeStartMs).coerceAtLeast(1)
            LinearProgressIndicator(
                progress = { ((player.absMs - player.rangeStartMs).toFloat() / span).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(2.dp), trackColor = Color.Transparent,
            )
            Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(player.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(player.subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                PlayCircle(playing = player.isPlaying, onClick = onToggle)
                if (player.hasNext) IconButton(onClick = onNext) { Icon(Icons.Filled.SkipNext, contentDescription = "Next") }
            }
        }
    }
}

@Composable
fun EmptyState(title: String, body: String, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    Column(modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(title, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp, bottom = 16.dp), lineHeight = 20.sp)
        action?.invoke()
    }
}

/** Compact row of chips: a bit of horizontal padding and wrapping so nothing is clipped on a narrow phone. */
@Composable
fun ChipRow(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    FlowRow(modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { content() }
}
