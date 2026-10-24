package com.stefan.callstudio

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import com.stefan.callstudio.ui.App
import com.stefan.callstudio.ui.CallStudioTheme
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* playback works either way */ }

    private val pickZip =
        registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) vm.importUri(uri) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleIntent(intent)

        // keep the screen on while a big library is being copied (a sleeping phone can kill the import)
        lifecycleScope.launch {
            vm.importState.collectLatest { s ->
                if (s is ImportUi.Running) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
        // ask for the notification permission once, the first time something plays (Android 13+ only)
        lifecycleScope.launch {
            vm.player.ui.collectLatest { ui ->
                if (ui.isPlaying && Build.VERSION.SDK_INT >= 33 && !vm.prefs.askedNotifications) {
                    vm.prefs.askedNotifications = true
                    notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }

        setContent {
            CallStudioTheme {
                App(vm, onPickImport = { pickZip.launch(arrayOf("application/zip", "application/x-zip-compressed", "application/octet-stream")) })
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    // "Open with Call Studio" / "Share to Call Studio" on a library .zip
    private fun handleIntent(intent: Intent?) {
        val uri: Uri? = when (intent?.action) {
            Intent.ACTION_VIEW -> intent.data
            Intent.ACTION_SEND ->
                if (Build.VERSION.SDK_INT >= 33) intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
                else @Suppress("DEPRECATION") intent.getParcelableExtra(Intent.EXTRA_STREAM)
            else -> null
        }
        if (uri != null) vm.importUri(uri)
    }
}
