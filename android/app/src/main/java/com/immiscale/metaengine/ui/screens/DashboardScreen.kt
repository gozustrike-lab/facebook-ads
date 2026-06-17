package com.immiscale.metaengine.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.immiscale.metaengine.data.model.TrendDirection
import com.immiscale.metaengine.ui.components.*
import com.immiscale.metaengine.ui.theme.*
import com.immiscale.metaengine.viewmodel.DashboardViewModel

// =============================================
// PANTALLA PRINCIPAL DEL DASHBOARD — MOBILE-FIRST
// =============================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = viewModel()
) {
    val metrics by viewModel.metrics.collectAsState()
    val metaConnection by viewModel.metaConnection.collectAsState()
    val alerts by viewModel.alerts.collectAsState()
    val currency by viewModel.selectedCurrency.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()

    val currencySymbol = if (currency == "USD") "$" else "S/."

    Scaffold(
        topBar = {
            ProTopAppBar(
                isConnected = metaConnection.isConnected,
                lastSyncTimestamp = metaConnection.lastSyncTimestamp,
                matchScore = metaConnection.matchScore,
                onCurrencyToggle = viewModel::toggleCurrency,
                currency = currency
            )
        },
        bottomBar = {
            ProBottomNavigationBar()
        },
        containerColor = SurfaceLight
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            // =============================================
            // SECCIÓN: MÉTRICAS CRÍTICAS (2 COLUMNAS)
            // =============================================
            SectionHeader(title = "Métricas Críticas")

            // Fila 1: Inversión + CPQL
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Tarjeta 1: Inversión Total
                Box(modifier = Modifier.weight(1f)) {
                    MetricCard(
                        title = "Inversión Total",
                        value = "$currencySymbol${"%,.2f".format(metrics.totalInvestment)}",
                        subtitle = "${metrics.totalInvestmentCurrency} · Hoy",
                        trend = metrics.cpqlTrend,
                        trendPercent = metrics.cpqlChangePercent,
                        accentColor = EmeraldDeep,
                        accentBgColor = EmeraldMint,
                        icon = {
                            Text("💵", fontSize = 16.sp)
                        }
                    )
                }

                // Tarjeta 2: CPQL
                Box(modifier = Modifier.weight(1f)) {
                    MetricCard(
                        title = "CPQL",
                        value = "$currencySymbol${"%,.2f".format(metrics.cpql)}",
                        subtitle = "Costo por Lead Calificado",
                        trend = metrics.cpqlTrend,
                        trendPercent = metrics.cpqlChangePercent,
                        accentColor = if (metrics.cpqlTrend == TrendDirection.DOWN) EmeraldDeep else Error,
                        accentBgColor = if (metrics.cpqlTrend == TrendDirection.DOWN) EmeraldMint else ErrorSoft,
                        icon = {
                            Text("🎯", fontSize = 16.sp)
                        }
                    )
                }
            }

            // Fila 2: Consultas Pagadas + Match Score
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Tarjeta 3: Consultas Pagadas
                Box(modifier = Modifier.weight(1f)) {
                    MetricCard(
                        title = "Consultas Pagadas",
                        value = metrics.paidConsultations.toString(),
                        subtitle = "$currencySymbol${"%,.0f".format(metrics.paidRevenue)} ingresos",
                        trend = TrendDirection.UP,
                        trendPercent = 15.7f,
                        accentColor = EmeraldDeep,
                        accentBgColor = EmeraldMint,
                        icon = {
                            Text("💳", fontSize = 16.sp)
                        }
                    )
                }

                // Tarjeta 4: Meta Match Score
                Box(modifier = Modifier.weight(1f)) {
                    MetricCard(
                        title = "Match Score",
                        value = "${metrics.matchScore}%",
                        subtitle = "Precisión API Conversiones",
                        trend = metrics.matchScoreTrend,
                        trendPercent = 2.1f,
                        accentColor = MetaBlue,
                        accentBgColor = MetaBlueSoft,
                        icon = {
                            Text("📊", fontSize = 16.sp, color = MetaBlue)
                        }
                    )
                }
            }

            // =============================================
            // SECCIÓN: ALERTAS DE AUTOMATIZACIÓN
            // =============================================
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                SectionHeader(title = "Automatización en Vivo")
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (alerts.any { it.type == com.immiscale.metaengine.data.model.AlertType.KILL_SWITCH }) ErrorSoft else EmeraldMint
                ) {
                    Text(
                        text = "${alerts.size} alertas",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = if (alerts.any { it.type == com.immiscale.metaengine.data.model.AlertType.KILL_SWITCH }) Error else EmeraldDeep
                        )
                    )
                }
            }

            // Lista de alertas
            alerts.take(6).forEach { alert ->
                AutomationAlertCard(
                    alert = alert,
                    onDismiss = { viewModel.dismissAlert(alert.id) }
                )
            }

            // Resumen de CAPI
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MetaBlueSoft)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                            .background(MetaBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔄", fontSize = 14.sp)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "CAPI Events Enviados",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = MetaBlueDark
                            )
                        )
                        Text(
                            text = "${metaConnection.capiEventsSent} eventos sincronizados",
                            style = MaterialTheme.typography.bodySmall.copy(color = MetaBlue)
                        )
                    }
                    Text(
                        text = "▸",
                        style = MaterialTheme.typography.titleMedium.copy(color = MetaBlue)
                    )
                }
            }

            Spacer(modifier = Modifier.height(80.dp)) // Bottom nav space
        }
    }
}

// =============================================
// COMPONENTES AUXILIARES
// =============================================

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.SemiBold,
            color = BlackExecutive
        )
    )
}

@Composable
private fun ProBottomNavigationBar() {
    var selectedItem by remember { mutableIntStateOf(0) }
    val items = listOf("Resumen", "Campañas", "Leads", "Ajustes")
    val icons = listOf("📊", "📣", "👥", "⚙️")
    val selectedIcons = listOf("📊", "📣", "👥", "⚙️")

    NavigationBar(
        modifier = Modifier.fillMaxWidth(),
        containerColor = White,
        tonalElevation = 8.dp
    ) {
        items.forEachIndexed { index, item ->
            NavigationBarItem(
                icon = {
                    Text(
                        text = icons[index],
                        fontSize = if (selectedItem == index) 22.sp else 18.sp
                    )
                },
                label = {
                    Text(
                        text = item,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = if (selectedItem == index) FontWeight.SemiBold else FontWeight.Medium,
                            color = if (selectedItem == index) EmeraldDeep else TextTertiary
                        )
                    )
                },
                selected = selectedItem == index,
                onClick = { selectedItem = index },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = EmeraldDeep,
                    indicatorColor = EmeraldMint,
                    unselectedIconColor = TextTertiary
                )
            )
        }
    }
}

// Extension function for number formatting
private fun String.Companion.format(fmt: String, vararg args: Any?): String {
    return java.lang.String.format(fmt, *args)
}
