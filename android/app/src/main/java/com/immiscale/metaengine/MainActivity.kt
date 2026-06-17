package com.immiscale.metaengine

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.immiscale.metaengine.ui.screens.DashboardScreen
import com.immiscale.metaengine.ui.theme.ImmiScaleTheme
import com.immiscale.metaengine.ui.theme.SurfaceLight

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ImmiScaleTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = SurfaceLight
                ) {
                    DashboardScreen()
                }
            }
        }
    }
}
