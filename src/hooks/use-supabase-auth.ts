'use client'

// ImmiScale v5 — Supabase Auth Hook
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useSupabaseAuth(): AuthState & {
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
} {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, session, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        scopes: 'ads_management ads_read business_management pages_read_engagement',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { ...state, signInWithFacebook, signOut }
}
