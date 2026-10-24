@file:OptIn(ExperimentalMaterial3Api::class)

package com.stefan.callstudio.ui

import android.net.Uri
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.PlaylistPlay
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.stefan.callstudio.AppViewModel
import com.stefan.callstudio.ImportUi

@Composable
fun App(vm: AppViewModel, onPickImport: () -> Unit) {
    val nav = rememberNavController()
    var showNow by rememberSaveable { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }

    val openCall: (String) -> Unit = { nav.navigate("call/${Uri.encode(it)}") }

    NavHost(nav, startDestination = "home") {
        composable("home") {
            HomeScreen(vm, snackbar, onPickImport, openCall, onOpenNow = { showNow = true })
        }
        composable("call/{name}") { entry ->
            val name = Uri.decode(entry.arguments?.getString("name") ?: "")
            CallScreen(vm, name, snackbar, onBack = { nav.popBackStack() }, onOpenNow = { showNow = true })
        }
    }
    if (showNow) NowPlayingSheet(vm, onDismiss = { showNow = false }, onOpenCall = openCall)
    ImportDialog(vm)
}

@Composable
private fun HomeScreen(vm: AppViewModel, snackbar: SnackbarHostState, onPickImport: () -> Unit, onOpenCall: (String) -> Unit, onOpenNow: () -> Unit) {
    var tab by rememberSaveable { mutableStateOf(0) }
    val player by vm.player.ui.collectAsState()
    val queue by vm.queue.collectAsState()
    // Back from Sections / Queue goes to Calls first; Back from Calls leaves the app
    androidx.activity.compose.BackHandler(enabled = tab != 0) { tab = 0 }
    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            Column {
                MiniPlayer(player, onToggle = vm.player::toggle, onNext = vm.player::next, onOpen = onOpenNow)
                NavigationBar {
                    NavigationBarItem(selected = tab == 0, onClick = { tab = 0 }, icon = { Icon(Icons.Filled.Headphones, null) }, label = { Text("Calls") })
                    NavigationBarItem(selected = tab == 1, onClick = { tab = 1 }, icon = { Icon(Icons.Filled.Search, null) }, label = { Text("Sections") })
                    NavigationBarItem(selected = tab == 2, onClick = { tab = 2 }, icon = { Icon(Icons.AutoMirrored.Filled.PlaylistPlay, null) },
                        label = { Text(if (queue.isEmpty()) "Queue" else "Queue (${queue.size})") })
                }
            }
        },
    ) { pad ->
        Column(Modifier.padding(pad)) {
            when (tab) {
                0 -> CallsScreen(vm, onOpenCall, onPickImport)
                1 -> SectionsScreen(vm, onOpenCall)
                else -> QueueScreen(vm)
            }
        }
    }
}

/** Progress while a library zip is being copied in, and the result afterwards. */
@Composable
private fun ImportDialog(vm: AppViewModel) {
    val state by vm.importState.collectAsState()
    when (val s = state) {
        ImportUi.Idle -> {}
        is ImportUi.Running -> AlertDialog(
            onDismissRequest = {},
            title = { Text("Importing library") },
            text = {
                Column {
                    LinearProgressIndicator(progress = { s.fraction }, modifier = Modifier.fillMaxWidth())
                    Text("${(s.fraction * 100).toInt()}%  ${s.message}", Modifier.padding(top = 10.dp))
                    Text("Keep the app open until this finishes.", Modifier.padding(top = 6.dp))
                }
            },
            confirmButton = {},
        )
        is ImportUi.Done -> AlertDialog(
            onDismissRequest = vm::dismissImport,
            title = { Text("Library updated") },
            text = {
                val r = s.result
                Text("${r.calls} calls in the bundle (${r.newCalls} new).\n${r.audioCopied} recordings copied, ${r.audioSkipped} already on the phone.")
            },
            confirmButton = { TextButton(onClick = vm::dismissImport) { Text("OK") } },
        )
        is ImportUi.Failed -> AlertDialog(
            onDismissRequest = vm::dismissImport,
            title = { Text("Import failed") },
            text = { Text(s.message) },
            confirmButton = { TextButton(onClick = vm::dismissImport) { Text("OK") } },
        )
    }
}
