// ImmiScale v5 — /api/ai/optimize
// Motor Analítico de IA con DeepSeek/Qwen
// Procesa métricas reales de campañas y genera recomendaciones accionables
// Prisma (primario) + Supabase campaign_insights (secundario)
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================
// SYSTEM PROMPT ESTÁTICO — Context Caching
// =============================================
const SYSTEM_PROMPT = `Eres el motor analítico de IA de ImmiScale v5. Tu rol es procesar métricas de Meta Ads inyectadas por Supabase/Prisma, automatizar decisiones en formato Mobile-First y generar recomendaciones accionables. Mantén el tono ejecutivo y estructurado.

SIEMPRE responde en JSON con esta estructura exacta:
{
  "diagnostico": "string - resumen ejecutivo de 1 línea",
  "accion": "ESCALAR" | "PAUSAR" | "MEJORAR_CREATIVE" | "MANTENER",
  "match_score": number (0-100),
  "cpl_prediccion": number (predicción del CPL en las próximas 24h),
  "presupuesto_sugerido": number (presupuesto diario sugerido en USD),
  "razones": ["razón 1", "razón 2", "razón 3"],
  "urgencia": "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
}

Reglas de decisión:
- Si CPL > 1.3x objetivo → PAUSAR (urgencia ALTA)
- Si CPL < 0.8x objetivo Y leads > 0 → ESCALAR (urgencia MEDIA)
- Si CTR < 1% → MEJORAR_CREATIVE (urgencia MEDIA)
- Si CPL entre 0.8x y 1.3x objetivo → MANTENER (urgencia BAJA)
- Si CPL > 1.5x objetivo → PAUSAR (urgencia CRITICA, kill switch)
- match_score: 100 = rendimiento perfecto, 0 = rendimiento nulo
  Fórmula sugerida: 100 - ((CPL_actual / CPL_objetivo - 1) * 50) - (CTR < 1% ? 20 : 0)
  Clamp entre 0 y 100.`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, campaign_id } = body

    // =============================================
    // 1. EXTRAER MÉTRICAS REALES — Prisma (primario)
    // =============================================
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaign_id },
      include: {
        adSets: {
          include: {
            region: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'No se encontró la campaña especificada.' },
        { status: 404 }
      )
    }

    // Calcular métricas agregadas de los adsets
    const adSets = campaign.adSets || []
    const totalSpend = adSets.reduce((sum, as) => sum + as.dailySpend, 0)
    const totalLeads = adSets.reduce((sum, as) => sum + as.leadCount, 0)
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0

    // CPL objetivo promedio de las regiones
    const cplTargets = adSets
      .map(as => as.region?.cplTarget)
      .filter(Boolean) as number[]
    const avgCplTarget = cplTargets.length > 0
      ? cplTargets.reduce((a, b) => a + b, 0) / cplTargets.length
      : 25.0

    // CTR estimado (basado en leads vs spend como aproximación)
    const ctrEstimate = totalSpend > 0 ? Math.min((totalLeads / (totalSpend * 2)) * 100, 15) : 0

    // =============================================
    // 2. INTENTAR EXTRAER DE SUPABASE (secundario)
    // =============================================
    let supabaseInsight = null
    if (user_id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const { data } = await supabase
          .from('campaign_insights')
          .select('*')
          .eq('user_id', user_id)
          .eq('campaign_id', campaign_id)
          .single()

        if (data) {
          supabaseInsight = data
        }
      } catch (supabaseErr) {
        console.warn('Supabase campaign_insights read failed (non-critical):', supabaseErr)
      }
    }

    // =============================================
    // 3. CONSTRUIR PROMPT DINÁMICO CON DATOS REALES
    // =============================================
    const insightData = supabaseInsight || {
      campaign_name: campaign.name,
      spend_today: totalSpend.toFixed(2),
      leads_count: totalLeads,
      cpl_actual: avgCpl.toFixed(2),
      cpl_max_target: (avgCplTarget * 1.5).toFixed(2),
      ctr_percentage: ctrEstimate.toFixed(2),
    }

    const userMessage = `Analiza la campaña "${insightData.campaign_name}". Gasto de hoy: $${insightData.spend_today}, Leads conseguidos: ${insightData.leads_count}, CPL actual: $${insightData.cpl_actual}, CPL máximo objetivo: $${insightData.cpl_max_target}, CTR: ${insightData.ctr_percentage}%. Genera el diagnóstico compacto en JSON con la acción comercial recomendada (Pausar / Escalar / Mejorar Creative / Mantener) y calcula el match_score del 0 al 100.`

    // =============================================
    // 4. LLAMADA A API DE IA (DeepSeek o Qwen)
    // =============================================
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.QWEN_API_KEY
    const isDeepSeek = !!process.env.DEEPSEEK_API_KEY

    if (!apiKey) {
      // Fallback: Motor de recomendación local (sin API key)
      const localRecommendation = calculateLocalRecommendation(
        campaign.name,
        avgCpl,
        avgCplTarget,
        totalLeads,
        totalSpend,
        ctrEstimate
      )

      await prisma.campaign.update({
        where: { id: campaign_id },
        data: { matchScore: localRecommendation.match_score },
      })

      await syncMatchScoreToSupabase(user_id, campaign_id, localRecommendation.match_score)

      return NextResponse.json({
        success: true,
        data: localRecommendation,
        source: 'local_engine',
        note: 'DEEPSEEK_API_KEY no configurada. Usando motor de recomendación local.',
      })
    }

    // Llamada HTTP a DeepSeek/Qwen API (URL correcta)
    const apiUrl = isDeepSeek
      ? 'https://api.deepseek.com/v1/chat/completions'
      : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: isDeepSeek ? 'deepseek-chat' : 'qwen-plus',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)

      const localRec = calculateLocalRecommendation(
        campaign.name, avgCpl, avgCplTarget, totalLeads, totalSpend, ctrEstimate
      )
      return NextResponse.json({
        success: true,
        data: localRec,
        source: 'local_fallback',
        note: `AI API error (${aiResponse.status}). Usando motor local.`,
      })
    }

    const aiData = await aiResponse.json()

    // Parsear respuesta IA (path correcto: choices[0].message.content)
    let recommendation
    try {
      const content = aiData.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty AI response')
      recommendation = typeof content === 'string' ? JSON.parse(content) : content
    } catch (parseErr) {
      console.error('AI response parse error:', parseErr)
      const localRec = calculateLocalRecommendation(
        campaign.name, avgCpl, avgCplTarget, totalLeads, totalSpend, ctrEstimate
      )
      return NextResponse.json({
        success: true,
        data: localRec,
        source: 'local_fallback',
        note: 'Error parsing AI response. Usando motor local.',
      })
    }

    // =============================================
    // 5. SINCRONIZAR MATCH SCORE EN DASHBOARD
    // =============================================
    if (recommendation.match_score !== undefined) {
      await prisma.campaign.update({
        where: { id: campaign_id },
        data: { matchScore: recommendation.match_score },
      })
    }

    await syncMatchScoreToSupabase(user_id, campaign_id, recommendation.match_score)

    return NextResponse.json({
      success: true,
      data: recommendation,
      source: isDeepSeek ? 'deepseek' : 'qwen',
      campaign_metrics: {
        name: campaign.name,
        total_spend: totalSpend,
        total_leads: totalLeads,
        avg_cpl: avgCpl,
        avg_cpl_target: avgCplTarget,
        ctr_estimate: ctrEstimate,
        adsets_analyzed: adSets.length,
      },
    })

  } catch (error) {
    console.error('Error en el motor de optimización de IA:', error)
    return NextResponse.json(
      { error: 'Error interno de procesamiento de IA.' },
      { status: 500 }
    )
  }
}

// =============================================
// MOTOR LOCAL DE RECOMENDACIÓN (FALLBACK)
// Sin dependencia de API externa
// =============================================
function calculateLocalRecommendation(
  campaignName: string,
  cplActual: number,
  cplTarget: number,
  leads: number,
  spend: number,
  ctr: number
) {
  const cplRatio = cplTarget > 0 ? cplActual / cplTarget : 2
  let accion: string
  let urgencia: string
  let matchScore: number

  if (cplRatio > 1.5) {
    accion = 'PAUSAR'
    urgencia = 'CRITICA'
    matchScore = Math.max(0, 100 - (cplRatio - 1) * 60)
  } else if (cplRatio > 1.3) {
    accion = 'PAUSAR'
    urgencia = 'ALTA'
    matchScore = Math.max(10, 100 - (cplRatio - 1) * 50)
  } else if (cplRatio < 0.8 && leads > 0) {
    accion = 'ESCALAR'
    urgencia = 'MEDIA'
    matchScore = Math.min(95, 85 + (1 - cplRatio) * 20)
  } else if (ctr < 1.0) {
    accion = 'MEJORAR_CREATIVE'
    urgencia = 'MEDIA'
    matchScore = Math.max(15, 60 - (1 - ctr) * 30)
  } else {
    accion = 'MANTENER'
    urgencia = 'BAJA'
    matchScore = Math.max(20, Math.min(90, 100 - Math.abs(cplRatio - 1) * 40))
  }

  matchScore = Math.round(Math.max(0, Math.min(100, matchScore)))

  const cplPrediccion = cplActual * (cplRatio > 1 ? 1.05 : 0.95)
  const presupuestoSugerido = accion === 'ESCALAR'
    ? spend * 1.15
    : accion === 'PAUSAR'
    ? spend * 0.5
    : spend

  const razones: string[] = []
  if (cplRatio > 1.3) razones.push(`CPL ($${cplActual.toFixed(2)}) supera ${((cplRatio - 1) * 100).toFixed(0)}% del objetivo ($${cplTarget.toFixed(2)})`)
  if (cplRatio < 0.8) razones.push(`CPL excelente ($${cplActual.toFixed(2)}) está ${((1 - cplRatio) * 100).toFixed(0)}% por debajo del objetivo`)
  if (ctr < 1.0) razones.push(`CTR bajo (${ctr.toFixed(2)}%) indica necesidad de mejorar creative`)
  if (leads === 0) razones.push('Sin leads generados — revisar targeting y oferta')
  if (razones.length === 0) razones.push('Rendimiento dentro de parámetros aceptables')

  return {
    diagnostico: `Campaña "${campaignName}": CPL $${cplActual.toFixed(2)} vs objetivo $${cplTarget.toFixed(2)} — ${accion}`,
    accion,
    match_score: matchScore,
    cpl_prediccion: Math.round(cplPrediccion * 100) / 100,
    presupuesto_sugerido: Math.round(presupuestoSugerido * 100) / 100,
    razones,
    urgencia,
  }
}

// =============================================
// SINCRONIZAR MATCH SCORE A SUPABASE
// =============================================
async function syncMatchScoreToSupabase(
  userId: string | undefined,
  campaignId: string,
  matchScore: number
) {
  if (!userId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return
  }

  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    await supabase
      .from('campaign_insights')
      .update({ match_score: matchScore })
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
  } catch {
    // Non-critical: Supabase sync is optional
  }
}
