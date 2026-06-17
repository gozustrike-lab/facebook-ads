package com.immiscale.metaengine.data.model

/**
 * Modelo de datos para la región/país configurado en el sistema.
 */
data class Region(
    val id: String,
    val code: String,
    val name: String,
    val currency: String,
    val cplTarget: Double,
    val cplKillSwitch: Double,
    val isActive: Boolean = true
)

/**
 * Modelo de métricas del dashboard en tiempo real.
 */
data class DashboardMetrics(
    val totalInvestment: Double,
    val totalInvestmentCurrency: String = "USD",
    val cpql: Double,
    val cpqlTrend: TrendDirection,
    val cpqlChangePercent: Float,
    val paidConsultations: Int,
    val paidRevenue: Double,
    val matchScore: Int,
    val matchScoreTrend: TrendDirection
)

/**
 * Dirección de tendencia para indicadores visuales.
 */
enum class TrendDirection {
    UP, DOWN, FLAT
}

/**
 * Modelo para alertas de automatización en tiempo real.
 */
data class AutomationAlert(
    val id: String,
    val type: AlertType,
    val title: String,
    val description: String,
    val region: String,
    val timestamp: Long,
    val isRead: Boolean = false
)

/**
 * Tipo de alerta de automatización.
 */
enum class AlertType {
    KILL_SWITCH,
    SCALE_VERTICAL,
    SCALE_HORIZONTAL,
    CAPI_SYNC,
    TOKEN_EXPIRED,
    BUDGET_WARNING
}

/**
 * Estado de conexión con Meta API.
 */
data class MetaConnectionState(
    val isConnected: Boolean,
    val lastSyncTimestamp: Long?,
    val matchScore: Int,
    val accountId: String?,
    val pixelId: String?,
    val capiEventsSent: Int = 0
)

/**
 * Lead calificado resumido para vista móvil.
 */
data class LeadSummary(
    val id: String,
    val fullName: String,
    val country: String,
    val route: LeadRoute,
    val visaType: String?,
    val score: Int,
    val status: LeadStatus
)

enum class LeadRoute {
    IN_COUNTRY_US,
    OUT_COUNTRY_GLOBAL
}

enum class LeadStatus {
    NEW, QUALIFIED, DISQUALIFIED, CONTACTED, PAID, LOST
}

/**
 * Campaña publicitaria resumida.
 */
data class CampaignSummary(
    val id: String,
    val name: String,
    val status: CampaignStatus,
    val totalSpend: Double,
    val totalBudget: Double,
    val leadCount: Int,
    val matchScore: Float,
    val adSetCount: Int
)

enum class CampaignStatus {
    ACTIVE, PAUSED, KILLED, COMPLETED
}

/**
 * Pago recibido resumido.
 */
data class PaymentSummary(
    val id: String,
    val amount: Double,
    val currency: String,
    val amountUsd: Double,
    val gateway: String,
    val status: PaymentStatus,
    val leadName: String
)

enum class PaymentStatus {
    PENDING, COMPLETED, FAILED, REFUNDED
}

/**
 * Datos diarios para gráficos.
 */
data class DailyDataPoint(
    val date: String,
    val spend: Double,
    val leads: Int,
    val cpql: Double
)
