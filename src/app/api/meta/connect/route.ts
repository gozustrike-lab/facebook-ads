// ImmiScale v5 — /api/meta/connect
// Autodetección de Ad Account + Pixel via Meta Graph API v21.0
// Guarda automáticamente en meta_credentials (Prisma) o meta_connections (Supabase)
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { meta_token, user_id, configuration_id } = body

    if (!meta_token) {
      return NextResponse.json(
        { error: 'meta_token es requerido' },
        { status: 400 }
      )
    }

    const META_API = 'https://graph.facebook.com/v21.0'

    // =============================================
    // 1. AUTODETECCIÓN: Consultar cuenta de anuncios
    // =============================================
    const adsResponse = await fetch(
      `${META_API}/me/adaccounts?fields=id,name,account_status&limit=5&access_token=${meta_token}`
    )
    const adsData = await adsResponse.json()

    if (adsData.error) {
      console.error('Meta API error (adaccounts):', adsData.error)
      return NextResponse.json(
        { error: `Error de Meta API: ${adsData.error.message || 'Token inválido'}` },
        { status: 400 }
      )
    }

    if (!adsData.data || adsData.data.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron cuentas de anuncios activas vinculadas a este token.' },
        { status: 400 }
      )
    }

    // Tomar la primera cuenta publicitaria activa
    const activeAccount = adsData.data.find(
      (acc: { account_status?: number }) => acc.account_status === 1
    ) || adsData.data[0]
    const adAccountId = activeAccount.id // Format: act_123456789

    // =============================================
    // 2. AUTODETECCIÓN DEL PÍXEL
    // =============================================
    let pixelId: string | null = null
    let pixelName: string | null = null
    try {
      const pixelResponse = await fetch(
        `${META_API}/${adAccountId}/adspixels?fields=id,name&limit=5&access_token=${meta_token}`
      )
      const pixelData = await pixelResponse.json()
      if (pixelData.data && pixelData.data.length > 0) {
        pixelId = pixelData.data[0].id
        pixelName = pixelData.data[0].name || null
      }
    } catch (pixelErr) {
      console.warn('No se pudo detectar pixel (non-critical):', pixelErr)
    }

    // =============================================
    // 3. AUTODETECCIÓN DE BUSINESS MANAGER
    // =============================================
    let businessId: string | null = null
    try {
      const businessResponse = await fetch(
        `${META_API}/me/businesses?fields=id,name&limit=1&access_token=${meta_token}`
      )
      const businessData = await businessResponse.json()
      if (businessData.data && businessData.data.length > 0) {
        businessId = businessData.data[0].id
      }
    } catch (bizErr) {
      console.warn('No se pudo detectar business manager (non-critical):', bizErr)
    }

    // =============================================
    // 4. VERIFICAR TOKEN — Obtener permisos y expiración
    // =============================================
    let tokenExpiresAt: Date | null = null
    let scopes: string[] = []
    try {
      const debugResponse = await fetch(
        `${META_API}/debug_token?input_token=${meta_token}&access_token=${meta_token}`
      )
      const debugData = await debugResponse.json()
      if (debugData.data) {
        scopes = debugData.data.scopes || []
        if (debugData.data.expires_at) {
          tokenExpiresAt = new Date(debugData.data.expires_at * 1000)
        }
      }
    } catch {
      // Non-critical: token debug is optional
    }

    // =============================================
    // 5. GUARDAR EN BASE DE DATOS (Prisma)
    // =============================================
    const existing = await prisma.metaCredential.findFirst()

    const savedCredential = await prisma.metaCredential.upsert({
      where: { id: existing?.id || 'nonexistent' },
      create: {
        appId: '', // Auto-detected, no manual input needed
        appSecret: '',
        accessToken: meta_token,
        accountId: adAccountId,
        pixelId: pixelId,
        businessId: businessId,
        tokenExpiresAt: tokenExpiresAt,
        scope: JSON.stringify(scopes),
        isConnected: true,
        connectionStatus: 'CONNECTED',
        graphApiVersion: 'v21.0',
        lastSyncAt: new Date(),
      },
      update: {
        accessToken: meta_token,
        accountId: adAccountId,
        pixelId: pixelId,
        businessId: businessId,
        tokenExpiresAt: tokenExpiresAt,
        scope: JSON.stringify(scopes),
        isConnected: true,
        connectionStatus: 'CONNECTED',
        errorMessage: null,
        lastSyncAt: new Date(),
      },
    })

    // =============================================
    // 6. INTENTAR GUARDAR EN SUPABASE (si está configurado)
    // =============================================
    if (user_id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Dynamic import to avoid crash when Supabase isn't configured
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        await supabase.from('meta_connections').upsert({
          user_id: user_id,
          meta_access_token: meta_token,
          configuration_id: configuration_id || null,
          ad_account_id: adAccountId,
          pixel_id: pixelId,
          connection_status: 'Connected',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        console.log('Meta credentials synced to Supabase successfully')
      } catch (supabaseErr) {
        console.warn('Supabase save failed (non-critical, Prisma is primary):', supabaseErr)
      }
    }

    // =============================================
    // 7. RESPUESTA EXITOSA
    // =============================================
    return NextResponse.json({
      success: true,
      message: 'Cuenta configurada automáticamente.',
      detected_account: activeAccount.name || adAccountId,
      detected_pixel: pixelName || pixelId,
      detected_business: businessId,
      ad_account_id: adAccountId,
      pixel_id: pixelId,
      business_id: businessId,
      scopes: scopes,
      token_expires_at: tokenExpiresAt?.toISOString() || null,
      credential_id: savedCredential.id,
    })

  } catch (error) {
    console.error('Error en /api/meta/connect:', error)
    return NextResponse.json(
      { error: 'Error interno al procesar la sincronización con Meta.' },
      { status: 500 }
    )
  }
}
