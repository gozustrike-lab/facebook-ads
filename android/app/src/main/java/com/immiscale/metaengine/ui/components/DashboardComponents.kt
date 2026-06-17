package com.immiscale.metaengine.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.immiscale.metaengine.data.model.AlertType
import com.immiscale.metaengine.data.model.AutomationAlert
import com.immiscale.metaengine.data.model.DashboardMetrics
import com.immiscale.metaengine.data.model.TrendDirection
import com.immiscale.metaengine.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

// =============================================
// TOP APP BAR PRO — CON INDICADOR META SYNC
// =============================================

@Composable
fun ProTopAppBar(
    isConnected: Boolean,
    lastSyncTimestamp: Long?,
    matchScore: Int,
    onCurrencyToggle: () -> Unit,
    currency: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = White,
        shadowElevation = 1.dp
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Logo + Título
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Icono Esmeralda
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(EmeraldGradientStart, EmeraldGradientEnd)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "⚖",
                            fontSize = 18.sp,
                            color = White
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "ImmiScale",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = BlackExecutive
                            )
                        )
                        Text(
                            text = "Meta Engine v5",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = TextTertiary
                            )
                        )
                    }
                }

                // Indicador Meta Sync
                MetaSyncIndicator(
                    isConnected = isConnected,
                    lastSync = lastSyncTimestamp,
                    onCurrencyToggle = onCurrencyToggle,
                    currency = currency
                )
            }

            // Línea de estado Meta
            MetaSyncStatusBar(isConnected = isConnected, matchScore = matchScore)
        }
    }
}

@Composable
private fun MetaSyncIndicator(
    isConnected: Boolean,
    lastSync: Long?,
    onCurrencyToggle: () -> Unit,
    currency: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        // Botón moneda
        Surface(
            onClick = onCurrencyToggle,
            shape = RoundedCornerShape(8.dp),
            color = SurfaceElevated
        ) {
            Text(
                text = currency,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = BlackExecutive
                )
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Indicador de conexión
        MetaConnectionPulse(isConnected = isConnected)

        Spacer(modifier = Modifier.width(4.dp))

        Column {
            Text(
                text = if (isConnected) "CAPI & Ads Sync" else "Desconectado",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = if (isConnected) MetaBlue else Error
                )
            )
            Text(
                text = if (isConnected) "Active" else "Offline",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = if (isConnected) EmeraldDeep else Error
                )
            )
        }
    }
}

@Composable
private fun MetaConnectionPulse(isConnected: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatableAnimation(
            animation = tween(800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Box(
        modifier = Modifier
            .size(10.dp)
            .clip(CircleShape)
            .background(
                color = if (isConnected) MetaBlue.copy(alpha = pulseAlpha) else Error.copy(alpha = 0.5f)
            )
    )
}

@Composable
private fun MetaSyncStatusBar(isConnected: Boolean, matchScore: Int) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = if (isConnected) MetaBlueSoft else ErrorSoft
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isConnected) "🟢 Meta API Conectada" else "🔴 Sin conexión a Meta API",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Medium,
                    color = if (isConnected) MetaBlueDark else Error
                )
            )
            Spacer(modifier = Modifier.weight(1f))
            if (isConnected) {
                Text(
                    text = "Match Score: $matchScore%",
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = EmeraldDeep
                    )
                )
            }
        }
    }
}

// =============================================
// TARJETA DE MÉTRICA CRÍTICA
// =============================================

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    trend: TrendDirection? = null,
    trendPercent: Float? = null,
    icon: @Composable () -> Unit,
    accentColor: Color = EmeraldDeep,
    accentBgColor: Color = EmeraldMint
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderLight, RoundedCornerShape(14.dp))
                .padding(14.dp)
        ) {
            // Fila superior: icono + título
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(accentBgColor),
                    contentAlignment = Alignment.Center
                ) {
                    icon()
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = TextTertiary,
                        fontWeight = FontWeight.Medium
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Valor principal
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = BlackExecutive
                    )
                )

                // Indicador de tendencia
                if (trend != null && trendPercent != null) {
                    val trendColor = when (trend) {
                        TrendDirection.UP -> if (title.contains("CPQL") || title.contains("Costo")) Error else TrendUp
                        TrendDirection.DOWN -> if (title.contains("CPQL") || title.contains("Costo")) TrendUp else Error
                        TrendDirection.FLAT -> TextTertiary
                    }
                    val trendIcon = when (trend) {
                        TrendDirection.UP -> "↑"
                        TrendDirection.DOWN -> "↓"
                        TrendDirection.FLAT → "→"
                    }
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = trendColor.copy(alpha = 0.1f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = trendIcon,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = trendColor
                                )
                            )
                            Text(
                                text = "${"%.1f".format(kotlin.math.abs(trendPercent))}%",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = trendColor
                                )
                            )
                        }
                    }
                }
            }

            // Subtítulo
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

// =============================================
// TARJETA DE ALERTA DE AUTOMATIZACIÓN
// =============================================

@Composable
fun AutomationAlertCard(
    alert: AutomationAlert,
    onDismiss: () -> Unit
) {
    val (iconBg, iconColor, iconText) = when (alert.type) {
        AlertType.KILL_SWITCH -> Triple(ErrorSoft, Error, "🛑")
        AlertType.SCALE_VERTICAL -> Triple(EmeraldMint, EmeraldDeep, "↕")
        AlertType.SCALE_HORIZONTAL -> Triple(MetaBlueSoft, MetaBlue, "↔")
        AlertType.CAPI_SYNC -> Triple(MetaBlueSoft, MetaBlue, "🔄")
        AlertType.TOKEN_EXPIRED -> Triple(WarningSoft, Warning, "🔑")
        AlertType.BUDGET_WARNING -> Triple(WarningSoft, Warning, "💰")
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onDismiss),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderLight, RoundedCornerShape(12.dp))
                .padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Icono de tipo
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Text(text = iconText, fontSize = 16.sp)
            }

            Spacer(modifier = Modifier.width(10.dp))

            // Contenido
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = alert.title,
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = BlackExecutive
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    // Badge de región
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = SurfaceElevated
                    ) {
                        Text(
                            text = alert.region,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextSecondary
                            )
                        )
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = alert.description,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = TextTertiary,
                        lineHeight = 14.sp
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = formatTimestamp(alert.timestamp),
                    style = MaterialTheme.labelSmall.copy(
                        color = TextTertiary
                    )
                )
            }
        }
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val diff = System.currentTimeMillis() - timestamp
    val minutes = diff / 60000
    return when {
        minutes < 1 -> "Ahora mismo"
        minutes < 60 -> "Hace ${minutes}m"
        minutes < 1440 -> "Hace ${minutes / 60}h"
        else -> "Hace ${minutes / 1440}d"
    }
}
