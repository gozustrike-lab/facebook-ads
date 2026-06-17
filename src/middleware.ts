// Middleware de Rate Limiting y Seguridad - ImmiScale Meta Engine v5
// Compatible con Vercel Serverless Functions
import { NextRequest, NextResponse } from 'next/server'

// Almacén en memoria para rate limiting (se reinicia en cada cold start en serverless)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Última limpieza
let lastCleanup = Date.now()

// Configuración por ruta
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  '/api/chatbot': { windowMs: 60_000, maxRequests: 20 },
  '/api/automation': { windowMs: 60_000, maxRequests: 10 },
  '/api/meta/auth': { windowMs: 60_000, maxRequests: 5 },
  '/api/seed': { windowMs: 300_000, maxRequests: 3 },
  '/api/capi': { windowMs: 60_000, maxRequests: 30 },
  'default': { windowMs: 60_000, maxRequests: 60 },
}

function getRateLimitConfig(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) return config
  }
  return RATE_LIMITS['default']
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; resetTime: number } {
  // Limpiar entradas expiradas cada 5 minutos (lazy cleanup en serverless)
  const now = Date.now()
  if (now - lastCleanup > 300_000) {
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) rateLimitStore.delete(key)
    }
    lastCleanup = now
  }

  const config = getRateLimitConfig(pathname)
  const key = `${ip}:${pathname}`

  const record = rateLimitStore.get(key)
  if (!record || now > record.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime }
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo aplicar a rutas API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip rutas internas de Vercel/Next.js
  if (pathname.startsWith('/api/_next') || pathname.startsWith('/api/__')) {
    return NextResponse.next()
  }

  // Obtener IP del cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Rate limiting
  const { allowed, remaining, resetTime } = checkRateLimit(ip, pathname)
  if (!allowed) {
    return NextResponse.json(
      {
        exito: false,
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetTime),
        },
      }
    )
  }

  // Headers de seguridad
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(resetTime))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
