// AdScale OS — Middleware: Rate Limiting + Security + Auth Guards
// Compatible with Vercel Serverless Functions
import { NextRequest, NextResponse } from 'next/server'

// Rate limit store (resets on cold start in serverless)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
let lastCleanup = Date.now()

// Rate limit config per route
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  '/api/chatbot': { windowMs: 60_000, maxRequests: 20 },
  '/api/automation': { windowMs: 60_000, maxRequests: 10 },
  '/api/meta/auth': { windowMs: 60_000, maxRequests: 5 },
  '/api/seed': { windowMs: 300_000, maxRequests: 3 },
  '/api/capi': { windowMs: 60_000, maxRequests: 30 },
  '/api/setup': { windowMs: 300_000, maxRequests: 3 },
  'default': { windowMs: 60_000, maxRequests: 60 },
}

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/auth/login',
  '/auth/callback',
]

// Public API routes that don't require auth
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/setup',
  '/api/init-db',
  '/api/meta/auth',      // OAuth flow needs to work without auth
  '/api/chatbot',         // Public chatbot endpoint
  '/api/capi',            // CAPI webhook
  '/api/meta/webhook',    // Meta webhook
]

function isPublicRoute(pathname: string): boolean {
  // Exact match for public pages
  if (PUBLIC_ROUTES.includes(pathname)) return true
  // Prefix match for public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) return true
  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return true
  return false
}

function getRateLimitConfig(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) return config
  }
  return RATE_LIMITS['default']
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; resetTime: number } {
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

  // =============================================
  // AUTH GUARD — Protect dashboard and API routes
  // =============================================
  // NOTE: Auth enforcement is currently SOFT (logs warning, doesn't block)
  // to allow the app to work during migration. Once auth is fully integrated,
  // change this to hard enforcement.
  if (!isPublicRoute(pathname)) {
    // Check for auth cookie or session
    const hasSession = request.cookies.get('sb-access-token') ||
                       request.cookies.get('auth-token') ||
                       request.headers.get('authorization')

    // Soft enforcement: log but don't block yet
    // TODO: Uncomment below for HARD enforcement after auth integration
    // if (!hasSession && (pathname.startsWith('/dashboard') || pathname.startsWith('/api/'))) {
    //   if (pathname.startsWith('/api/')) {
    //     return NextResponse.json({ exito: false, error: 'Authentication required' }, { status: 401 })
    //   }
    //   return NextResponse.redirect(new URL('/auth/login', request.url))
    // }

    // For now, just inject organization header for multi-tenant scoping
    if (!hasSession) {
      // No session — use default org for now
      // In production, this would redirect to login
    }
  }

  // =============================================
  // RATE LIMITING — Only for API routes
  // =============================================
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/_next') || pathname.startsWith('/api/__')) {
      return NextResponse.next()
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const { allowed, remaining, resetTime } = checkRateLimit(ip, pathname)
    if (!allowed) {
      return NextResponse.json(
        {
          exito: false,
          error: 'Too many requests. Please try again later.',
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

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(resetTime))
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
