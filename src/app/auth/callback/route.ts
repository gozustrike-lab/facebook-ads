// ImmiScale v5 — Auth Callback Route
// Handles OAuth callback from Facebook via Supabase
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // After successful OAuth, auto-configure Meta credentials
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const providerToken = session?.provider_token as string | undefined
        const providerRefreshToken = session?.provider_refresh_token as string | undefined

        if (providerToken && session?.user) {
          // Auto-detect Ad Account, Pixel, Business ID from Facebook
          const metaApiBase = 'https://graph.facebook.com/v21.0'
          const headers = { Authorization: `Bearer ${providerToken}` }

          // Fetch Ad Accounts
          let accountId: string | null = null
          try {
            const accountsRes = await fetch(`${metaApiBase}/me/adaccounts?fields=id,name&limit=1`, { headers })
            const accountsData = await accountsRes.json()
            accountId = accountsData.data?.[0]?.id ?? null
          } catch { /* non-critical */ }

          // Fetch Pixels
          let pixelId: string | null = null
          if (accountId) {
            try {
              const pixelsRes = await fetch(`${metaApiBase}/${accountId}/pixels?fields=id,name&limit=1`, { headers })
              const pixelsData = await pixelsRes.json()
              pixelId = pixelsData.data?.[0]?.id ?? null
            } catch { /* non-critical */ }
          }

          // Fetch Business Manager
          let businessId: string | null = null
          try {
            const businessRes = await fetch(`${metaApiBase}/me/businesses?fields=id,name&limit=1`, { headers })
            const businessData = await businessRes.json()
            businessId = businessData.data?.[0]?.id ?? null
          } catch { /* non-critical */ }

          // Upsert Meta credentials
          await supabase.from('meta_credentials').upsert({
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
        }
      } catch (configError) {
        console.error('Auto-config error (non-fatal):', configError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
