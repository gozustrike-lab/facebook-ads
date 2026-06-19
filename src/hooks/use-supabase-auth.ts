'use client'

// ImmiScale v5 — Supabase Auth Hook
// SAFE: Gracefully handles missing Supabase config (app works without it)
import { useEffect, useState, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
}

export function useSupabaseAuth(): AuthState & {
  signInWithFacebook: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
} {
  const configured = isSupabaseConfigured()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: configured, // Only loading if Supabase is actually configured
    isConfigured: configured,
  })

  useEffect(() => {
    if (!configured) {
      // No Supabase = no auth, app works normally without it
      setState({ user: null, session: null, loading: false, isConfigured: false })
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setState({ user: null, session: null, loading: false, isConfigured: false })
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false, isConfigured: true })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, session, loading: false, isConfigured: true })
      }
    )

    return () => subscription.unsubscribe()
  }, [configured])

  const signInWithFacebook = useCallback(async () => {
    // Facebook Login for Business — Direct OAuth flow
    // Bypasses Supabase to ensure config_id is passed correctly
    // Supabase doesn't reliably forward config_id to Facebook's OAuth dialog
    window.location.href = '/api/meta/auth'
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      console.warn('Supabase no está configurado. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      console.error('Error al iniciar sesión con Google:', error.message)
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return { ...state, signInWithFacebook, signInWithGoogle, signOut }
}
