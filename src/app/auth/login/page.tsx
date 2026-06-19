'use client'

// ImmiScale v5 — Login Page
// Google + Facebook Auth via Supabase
// Mobile-First: Clean, centered, minimal

import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Scale, Facebook, Mail, Loader2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const { signInWithGoogle, signInWithFacebook, isConfigured, loading, user } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [signingIn, setSigningIn] = useState<'google' | 'facebook' | null>(null)
  const error = searchParams.get('error')

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    setSigningIn('google')
    await signInWithGoogle()
    // Don't reset signingIn - the page will redirect
  }

  const handleFacebookSignIn = async () => {
    setSigningIn('facebook')
    await signInWithFacebook()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="rounded-2xl shadow-xl border-border/50">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Logo + Title */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Scale className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ImmiScale</h1>
                <p className="text-sm text-muted-foreground">Meta Engine v5</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Adquisición multinacional de clientes para abogados de inmigración
              </p>
            </div>

            {/* Error messages */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error === 'supabase_not_configured'
                    ? 'Supabase no está configurado. Contacta al administrador.'
                    : error === 'auth_callback_failed'
                    ? 'Error en la autenticación. Intenta de nuevo.'
                    : 'Error desconocido. Intenta de nuevo.'}
                </p>
              </div>
            )}

            {!isConfigured && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Autenticación no disponible. Configura Supabase para habilitar login con Google y Facebook.
                </p>
              </div>
            )}

            {/* Auth Buttons */}
            <div className="space-y-3">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={!isConfigured || signingIn === 'google' || loading}
                className="w-full py-4 text-base font-semibold rounded-xl gap-3
                           bg-white dark:bg-slate-800 text-foreground
                           border-2 border-border/50 hover:border-border
                           hover:bg-gray-50 dark:hover:bg-slate-700
                           shadow-sm active:scale-[0.98] transition-all duration-150"
              >
                {signingIn === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continuar con Google
              </Button>

              {/* Facebook Business Sign In */}
              <Button
                onClick={handleFacebookSignIn}
                disabled={!isConfigured || signingIn === 'facebook' || loading}
                className="w-full py-4 text-base font-semibold rounded-xl gap-3
                           bg-[#1877F2] hover:bg-[#166FE5] text-white
                           shadow-sm shadow-blue-500/20
                           active:scale-[0.98] transition-all duration-150"
              >
                {signingIn === 'facebook' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Facebook className="h-5 w-5" />
                )}
                Continuar con Meta Business
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">o accede sin autenticación</span>
              </div>
            </div>

            {/* Skip login (dev mode) */}
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full py-3 rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              Entrar al Dashboard
            </Button>

            {/* Footer */}
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
              Tus datos están protegidos con encriptación de grado militar.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
