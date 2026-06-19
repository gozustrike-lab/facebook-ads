// ImmiScale v5 — Auth Callback Route
// Handles OAuth callback from Facebook Login for Business / Google via Supabase
// Processes both system user tokens (Business) and regular user tokens
// SAFE: Returns helpful error if Supabase is not configured
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Check if Supabase is configured
  if (!isSupabaseServerConfigured()) {
    console.error('Supabase no configurado. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.')
    return NextResponse.redirect(`${origin}/?error=supabase_not_configured`)
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.redirect(`${origin}/?error=supabase_init_failed`)
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // After successful OAuth, auto-configure Meta credentials
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const providerToken = session?.provider_token as string | undefined
        const providerRefreshToken = session?.provider_refresh_token as string | undefined

        if (providerToken && session?.user) {
          // Auto-detect Ad Account, Pixel, Business ID from Facebook
          // Works with both Business Login tokens and standard user tokens
          console.log('[Auth Callback] Provider token received, auto-configuring Meta credentials...')
          const metaApiBase = 'https://graph.facebook.com/v21.0'

          // Fetch Ad Accounts — Business Login grants system user access
          let accountId: string | null = null
          try {
            const accountsRes = await fetch(
              `${metaApiBase}/me/adaccounts?fields=id,name&limit=5&access_token=${providerToken}`
            )
            const accountsData = await accountsRes.json()
            if (accountsData.error) {
              console.error('[Auth Callback] Meta API error (adaccounts):', accountsData.error)
            } else {
              // Prefer active accounts
              const activeAccount = accountsData.data?.find(
                (acc: { account_status?: number }) => acc.account_status === 1
              )
              accountId = (activeAccount || accountsData.data?.[0])?.id ?? null
              console.log('[Auth Callback] Detected Ad Account:', accountId)
            }
          } catch (err) {
            console.warn('[Auth Callback] Failed to fetch ad accounts (non-critical):', err)
          }

          // Fetch Pixels
          let pixelId: string | null = null
          if (accountId) {
            try {
              const pixelsRes = await fetch(
                `${metaApiBase}/${accountId}/adspixels?fields=id,name&limit=5&access_token=${providerToken}`
              )
              const pixelsData = await pixelsRes.json()
              pixelId = pixelsData.data?.[0]?.id ?? null
              console.log('[Auth Callback] Detected Pixel:', pixelId)
            } catch (err) {
              console.warn('[Auth Callback] Failed to fetch pixels (non-critical):', err)
            }
          }

          // Fetch Business Manager — critical for Facebook Login for Business
          let businessId: string | null = null
          try {
            const businessRes = await fetch(
              `${metaApiBase}/me/businesses?fields=id,name&limit=5&access_token=${providerToken}`
            )
            const businessData = await businessRes.json()
            businessId = businessData.data?.[0]?.id ?? null
            console.log('[Auth Callback] Detected Business:', businessId)
          } catch (err) {
            console.warn('[Auth Callback] Failed to fetch business manager (non-critical):', err)
          }

          // Upsert Meta credentials — works with Business Login tokens
          const { error: upsertError } = await supabase.from('meta_credentials').upsert({
            user_id: session.user.id,
            access_token: providerToken,
            refresh_token: providerRefreshToken,
            account_id: accountId,
            pixel_id: pixelId,
            business_id: businessId,
            is_connected: true,
            connection_status: 'CONNECTED',
            graph_api_version: 'v21.0',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

          if (upsertError) {
            console.error('[Auth Callback] Supabase upsert error:', upsertError)
          } else {
            console.log('[Auth Callback] Meta credentials saved successfully')
          }

          // Also call /api/meta/connect to save to Prisma (primary DB)
          try {
            await fetch(`${origin}/api/meta/connect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meta_token: providerToken,
                user_id: session.user.id,
                configuration_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || null,
              }),
            })
            console.log('[Auth Callback] Prisma sync triggered via /api/meta/connect')
          } catch (prismaErr) {
            console.warn('[Auth Callback] Prisma sync failed (non-critical):', prismaErr)
          }
        }
      } catch (configError) {
        console.error('Auto-config error (non-fatal):', configError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to home on error
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
