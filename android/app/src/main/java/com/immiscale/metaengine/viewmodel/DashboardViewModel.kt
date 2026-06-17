package com.immiscale.metaengine.viewmodel

import androidx.lifecycle.ViewModel
import com.immiscale.metaengine.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import androidx.lifecycle.viewModelScope
import kotlin.random.Random

/**
 * ViewModel principal del Dashboard con estados reactivos.
 * Simula datos en tiempo real para demostración.
 */
class DashboardViewModel : ViewModel() {

    // =============================================
    // ESTADOS REACTIVOS
    // =============================================

    private val _metrics = MutableStateFlow(DashboardMetrics(
        totalInvestment = 13980.75,
        totalInvestmentCurrency = "USD",
        cpql = 28.45,
        cpqlTrend = TrendDirection.DOWN,
        cpqlChangePercent = -3.2f,
        paidConsultations = 12,
        paidRevenue = 4720.00,
        matchScore = 82,
        matchScoreTrend = TrendDirection.UP
    ))
    val metrics: StateFlow<DashboardMetrics> = _metrics.asStateFlow()

    private val _metaConnection = MutableStateFlow(MetaConnectionState(
        isConnected = true,
        lastSyncTimestamp = System.currentTimeMillis() - 12000,
        matchScore = 82,
        accountId = "act_987654321",
        pixelId = "PX-4829103",
        capiEventsSent = 847
    ))
    val metaConnection: StateFlow<MetaConnectionState> = _metaConnection.asStateFlow()

    private val _alerts = MutableStateFlow(generateInitialAlerts())
    val alerts: StateFlow<List<AutomationAlert>> = _alerts.asStateFlow()

    private val _dailyData = MutableStateFlow(generateDailyData())
    val dailyData: StateFlow<List<DailyDataPoint>> = _dailyData.asStateFlow()

    private val _selectedCurrency = MutableStateFlow("USD")
    val selectedCurrency: StateFlow<String> = _selectedCurrency.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    // =============================================
    // SIMULACIÓN EN TIEMPO REAL
    // =============================================

    init {
        startRealTimeSimulation()
    }

    private fun startRealTimeSimulation() {
        viewModelScope.launch {
            while (isActive) {
                delay(5000)
                simulateMetricUpdate()
            }
        }

        viewModelScope.launch {
            while (isActive) {
                delay(8000)
                simulateNewAlert()
            }
        }

        viewModelScope.launch {
            while (isActive) {
                delay(3000)
                simulateSyncPulse()
            }
        }
    }

    private fun simulateMetricUpdate() {
        val current = _metrics.value
        val spendVariation = Random.nextDouble(-50.0, 150.0)
        val cpqlVariation = Random.nextDouble(-1.5, 1.5)

        _metrics.value = current.copy(
            totalInvestment = current.totalInvestment + spendVariation.coerceAtLeast(0.0),
            cpql = (current.cpql + cpqlVariation).coerceIn(15.0, 45.0),
            cpqlTrend = if (cpqlVariation < 0) TrendDirection.DOWN else TrendDirection.UP,
            cpqlChangePercent = (cpqlVariation / current.cpql * 100).toFloat(),
            paidConsultations = if (Random.nextFloat() > 0.7) current.paidConsultations + 1 else current.paidConsultations,
            matchScore = (current.matchScore + Random.nextInt(-2, 3)).coerceIn(60, 98),
            paidRevenue = current.paidRevenue + if (Random.nextFloat() > 0.7) Random.nextDouble(200.0, 600.0) else 0.0
        )
    }

    private fun simulateNewAlert() {
        val currentAlerts = _alerts.value.toMutableList()
        val newAlert = generateRandomAlert()
        currentAlerts.add(0, newAlert)
        if (currentAlerts.size > 20) currentAlerts.removeLast()
        _alerts.value = currentAlerts
    }

    private fun simulateSyncPulse() {
        val current = _metaConnection.value
        _metaConnection.value = current.copy(
            lastSyncTimestamp = System.currentTimeMillis(),
            capiEventsSent = current.capiEventsSent + Random.nextInt(1, 5),
            matchScore = _metrics.value.matchScore
        )
    }

    fun toggleCurrency() {
        _selectedCurrency.value = if (_selectedCurrency.value == "USD") "PEN" else "USD"
        val current = _metrics.value
        if (_selectedCurrency.value == "PEN") {
            _metrics.value = current.copy(
                totalInvestment = current.totalInvestment * 3.72,
                totalInvestmentCurrency = "PEN",
                cpql = current.cpql * 3.72,
                paidRevenue = current.paidRevenue * 3.72
            )
        } else {
            _metrics.value = current.copy(
                totalInvestment = current.totalInvestment / 3.72,
                totalInvestmentCurrency = "USD",
                cpql = current.cpql / 3.72,
                paidRevenue = current.paidRevenue / 3.72
            )
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            delay(1500)
            simulateMetricUpdate()
            simulateNewAlert()
            simulateSyncPulse()
            _isRefreshing.value = false
        }
    }

    fun dismissAlert(alertId: String) {
        _alerts.value = _alerts.value.filter { it.id != alertId }
    }

    // =============================================
    // GENERADORES DE DATOS DEMO
    // =============================================

    private fun generateInitialAlerts(): List<AutomationAlert> {
        val now = System.currentTimeMillis()
        return listOf(
            AutomationAlert("1", AlertType.KILL_SWITCH, "Anuncio #043 APAGADO", "CPL superó 1.5x el umbral en Perú ($52.50 > $35.00)", "PE", now - 180000),
            AutomationAlert("2", AlertType.SCALE_VERTICAL, "Presupuesto ESCALADO +15% V", "Campaña EE.UU. - AdSet Broad incrementado a $57.50/día", "US", now - 420000),
            AutomationAlert("3", AlertType.CAPI_SYNC, "CAPI Sync Exitoso", "847 eventos enviados a Meta Pixel PX-4829103", "GLOBAL", now - 600000),
            AutomationAlert("4", AlertType.SCALE_HORIZONTAL, "AdSet DUPLICADO", "Audiencia Lookalike creada para Colombia desde AdSet #027", "CO", now - 900000),
            AutomationAlert("5", AlertType.BUDGET_WARNING, "Presupuesto al 87%", "Campaña EB-2 NIW Latam acercándose al límite diario", "GLOBAL", now - 1200000),
            AutomationAlert("6", AlertType.TOKEN_EXPIRED, "Token renovado", "Access Token de Meta renovado automáticamente (60 días)", "GLOBAL", now - 1800000),
            AutomationAlert("7", AlertType.KILL_SWITCH, "Anuncio #019 APAGADO", "CPL en México superó 1.5x ($812 > $540 CPL objetivo)", "MX", now - 2400000),
            AutomationAlert("8", AlertType.SCALE_VERTICAL, "Presupuesto ESCALADO +15% V", "Campaña Inmigración EE.UU. - AdSet Custom → $46.00/día", "US", now - 3600000),
        )
    }

    private fun generateRandomAlert(): AutomationAlert {
        val regions = listOf("US", "PE", "CO", "MX", "GLOBAL")
        val region = regions.random()
        val alertTemplates = listOf(
            Triple(AlertType.KILL_SWITCH, "AdSet #${Random.nextInt(10, 99)} APAGADO", "CPL superó 1.5x en $region — desconectado automáticamente"),
            Triple(AlertType.SCALE_VERTICAL, "Presupuesto ESCALADO +15% V", "Campaña en $region incrementada por rendimiento óptimo"),
            Triple(AlertType.SCALE_HORIZONTAL, "AdSet DUPLICADO", "Nueva audiencia Lookalike creada para $region"),
            Triple(AlertType.CAPI_SYNC, "CAPI Sync ${Random.nextInt(50, 200)} eventos", "Eventos de conversión enviados a Meta desde $region"),
            Triple(AlertType.BUDGET_WARNING, "Presupuesto al ${Random.nextInt(75, 95)}%", "Campaña en $region acercándose al límite diario"),
        )
        val (type, title, desc) = alertTemplates.random()
        return AutomationAlert(
            id = java.util.UUID.randomUUID().toString(),
            type = type,
            title = title,
            description = desc,
            region = region,
            timestamp = System.currentTimeMillis()
        )
    }

    private fun generateDailyData(): List<DailyDataPoint> {
        val dates = listOf("11 Jun", "12 Jun", "13 Jun", "14 Jun", "15 Jun", "16 Jun", "17 Jun")
        return dates.mapIndexed { index, date ->
            DailyDataPoint(
                date = date,
                spend = Random.nextDouble(1200.0, 2800.0),
                leads = Random.nextInt(8, 28),
                cpql = Random.nextDouble(22.0, 38.0)
            )
        }
    }
}
