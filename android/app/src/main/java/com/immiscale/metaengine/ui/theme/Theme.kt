package com.immiscale.metaengine.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val ImmiScaleColorScheme = lightColorScheme(
    primary = EmeraldDeep,
    onPrimary = White,
    primaryContainer = EmeraldMint,
    onPrimaryContainer = EmeraldDeep,

    secondary = MetaBlue,
    onSecondary = White,
    secondaryContainer = MetaBlueSoft,
    onSecondaryContainer = MetaBlueDark,

    tertiary = EmeraldMedium,
    background = SurfaceLight,
    onBackground = BlackExecutive,

    surface = White,
    onSurface = BlackExecutive,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,

    error = Error,
    onError = White,
    errorContainer = ErrorSoft,
    onErrorContainer = Error,

    outline = BorderLight,
    outlineVariant = BorderMedium,
)

@Composable
fun ImmiScaleTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ImmiScaleColorScheme,
        typography = ImmiScaleTypography,
        content = content
    )
}
