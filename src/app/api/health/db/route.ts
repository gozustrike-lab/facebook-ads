// Diagnóstico avanzado de conexión a la base de datos
// Prueba AMBAS URLs (pooler y directa) por separado
// Y muestra los detalles parseados (sin mostrar la contraseña)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const diagnostico: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    paso: 'verificando',
  }

  // =============================================
  // PASO 1: Verificar variables de entorno
  // =============================================
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''

  diagnostico.env = {
    DATABASE_URL_set: !!dbUrl,
    DIRECT_URL_set: !!directUrl,
    META_APP_ID_set: !!process.env.META_APP_ID,
    META_APP_SECRET_set: !!process.env.META_APP_SECRET,
    NEXT_PUBLIC_META_CONFIG_ID_set: !!process.env.NEXT_PUBLIC_META_CONFIG_ID,
  }

  // =============================================
  // PASO 2: Parsear y mostrar detalles de la URL (SIN contraseña)
  // =============================================
  function parsearUrl(url: string, label: string) {
    try {
      const parsed = new URL(url)
      return {
        label,
        protocol: parsed.protocol,
        username: parsed.username,
        passwordLength: parsed.password.length,
        passwordHasAt: parsed.password.includes('@'),
        passwordHasPercent40: parsed.password.includes('%40'),
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.slice(1),
        searchParams: parsed.search,
      }
    } catch (e) {
      return { label, error: 'URL inválida', raw: url.substring(0, 20) + '...' }
    }
  }

  const dbUrlDetails = parsearUrl(dbUrl, 'DATABASE_URL (pooler/runtime)')
  const directUrlDetails = parsearUrl(directUrl, 'DIRECT_URL (migraciones)')

  diagnostico.urlDetails = {
    database_url: dbUrlDetails,
    direct_url: directUrlDetails,
  }

  // =============================================
  // PASO 3: Detectar problemas comunes
  // =============================================
  const problemas: string[] = []

  if (dbUrlDetails && 'passwordHasAt' in dbUrlDetails) {
    if (dbUrlDetails.passwordHasAt) {
      problemas.push('DATABASE_URL: La contraseña contiene @ sin codificar. Reemplaza @ por %40 en la contraseña.')
    }
    if (!dbUrlDetails.username.includes('.')) {
      problemas.push('DATABASE_URL: El username del pooler debe incluir el project-ref (ej: postgres.bpmodbfjhlgvvceiuzwg). Solo "postgres" es para conexión directa.')
    }
    if (dbUrlDetails.port !== '6543') {
      problemas.push(`DATABASE_URL: Puerto ${dbUrlDetails.port} — para Vercel serverless debe ser 6543 (pooler), no 5432 (directo).`)
    }
  }

  if (directUrlDetails && 'passwordHasAt' in directUrlDetails) {
    if (directUrlDetails.passwordHasAt) {
      problemas.push('DIRECT_URL: La contraseña contiene @ sin codificar. Reemplaza @ por %40 en la contraseña.')
    }
    if (directUrlDetails.username.includes('.')) {
      problemas.push('DIRECT_URL: El username para conexión directa debe ser solo "postgres" (sin project-ref). El project-ref es solo para el pooler.')
    }
    if (directUrlDetails.port !== '5432') {
      problemas.push(`DIRECT_URL: Puerto ${directUrlDetails.port} — para conexión directa debe ser 5432.`)
    }
  }

  diagnostico.problemas = problemas

  // =============================================
  // PASO 4: Probar conexión con Prisma (usa DATABASE_URL)
  // =============================================
  try {
    await db.$queryRaw`SELECT 1`
    diagnostico.paso = 'conexion_ok'
    diagnostico.dbConnection = 'OK'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    diagnostico.paso = 'conexion_fallo'
    diagnostico.dbConnection = 'FAILED'
    diagnostico.dbError = msg

    // Detectar tipo de error específico
    if (msg.includes('P1000') || msg.includes('Authentication failed')) {
      diagnostico.causa = 'CREDENCIALES_INCORRECTAS'
      diagnostico.solucion = 'La contraseña en la URL no es válida. Posibles causas: (1) El @ en la contraseña no está codificado como %40, (2) La contraseña es incorrecta, (3) El username es incorrecto para el tipo de conexión.'
    } else if (msg.includes('P1001') || msg.includes("Can't reach")) {
      diagnostico.causa = 'SERVIDOR_NO_ALCANZABLE'
      diagnostico.solucion = 'No se puede alcanzar el host. Verifica que el hostname sea correcto.'
    } else if (msg.includes('prepared statement') || msg.includes('pgbouncer')) {
      diagnostico.causa = 'PGBOUNCER_DDL'
      diagnostico.solucion = 'pgbouncer no soporta esta operación. Verifica que estés usando el pooler solo para queries, no para DDL.'
    }

    return NextResponse.json(diagnostico, { status: 500 })
  }

  // =============================================
  // PASO 5: Verificar tablas
  // =============================================
  try {
    const tablas = ['Region', 'Campaign', 'AdSet', 'Lead', 'Metric', 'MetaCredential', 'CAPIEvent', 'ChatSession', 'Payment']
    const conteos: Record<string, number> = {}

    for (const tabla of tablas) {
      try {
        // @ts-expect-error - Dynamic model access
        conteos[tabla] = await db[tabla.charAt(0).toLowerCase() + tabla.slice(1)].count()
      } catch {
        conteos[tabla] = -1
      }
    }

    diagnostico.paso = 'completo'
    diagnostico.tables = conteos
    diagnostico.tablesOk = Object.values(conteos).every(c => c >= 0)
  } catch (err) {
    diagnostico.tablesError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(diagnostico)
}
