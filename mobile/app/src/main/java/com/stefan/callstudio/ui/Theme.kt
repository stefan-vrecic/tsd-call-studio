package com.stefan.callstudio.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Light = lightColorScheme(
    primary = Color(0xFF2563EB), onPrimary = Color.White,
    primaryContainer = Color(0xFFDBEAFE), onPrimaryContainer = Color(0xFF1E3A8A),
    secondaryContainer = Color(0xFFE0E7FF), onSecondaryContainer = Color(0xFF1E1B4B),
    background = Color(0xFFF8FAFC), onBackground = Color(0xFF0F172A),
    surface = Color(0xFFFFFFFF), onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9), onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1), outlineVariant = Color(0xFFE2E8F0),
    error = Color(0xFFDC2626),
)

private val Dark = darkColorScheme(
    primary = Color(0xFF60A5FA), onPrimary = Color(0xFF0B1220),
    primaryContainer = Color(0xFF1E3A8A), onPrimaryContainer = Color(0xFFDBEAFE),
    secondaryContainer = Color(0xFF312E81), onSecondaryContainer = Color(0xFFE0E7FF),
    background = Color(0xFF000000), onBackground = Color(0xFFE5E7EB), // true black: saves battery on the AMOLED screen
    surface = Color(0xFF0B1220), onSurface = Color(0xFFE5E7EB),
    surfaceVariant = Color(0xFF111827), onSurfaceVariant = Color(0xFF9CA3AF),
    outline = Color(0xFF374151), outlineVariant = Color(0xFF1F2937),
    error = Color(0xFFF87171),
)

@Composable
fun CallStudioTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, content = content)
}

/** The Mac's blue ("mine") and amber ("not mine") row tints. */
object Tints {
    @Composable fun mine(): Color = if (isSystemInDarkTheme()) Color(0xFF172554) else Color(0xFFDBEAFE)
    @Composable fun other(): Color = if (isSystemInDarkTheme()) Color(0xFF422006) else Color(0xFFFEF3C7)
    @Composable fun highlight(): Color = if (isSystemInDarkTheme()) Color(0xFFFB923C) else Color(0xFFC2410C)
}
