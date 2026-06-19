// Diagnóstico de conexión a la base de datos
// GET /api/health/db — Retorna estado detallado de la conexión

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const diagnostico: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DIRECT_URL_set: !!process.env.DIRECT_URL,
      META_APP_ID_set: !!process.env.META_APP_ID,
      META_APP_SECRET_set: !!process.env.META_APP_SECRET,
      NEXT_PUBLIC_META_CONFIG_ID_set: !!process.env.NEXT_PUBLIC_META_CONFIG_ID,
    },
  }

  // Test 1: Conexión básica
  try {
    await db.$queryRaw`SELECT 1`
    diagnostico.dbConnection = 'OK'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    diagnostico.dbConnection = 'FAILED'
    diagnostico.dbError = msg

    // Detectar errores comunes
    if (msg.includes('P1000') || msg.includes('Authentication failed')) {
      diagnostico.hint = 'Las credenciales de la base de datos son incorrectas. Verifica DATABASE_URL y DIRECT_URL en Vercel. Si tu contraseña tiene @, reemplázalo por %40.'
    } else if (msg.includes('P1001') || msg.includes("Can't reach")) {
      diagnostico.hint = 'No se puede alcanzar el servidor de base de datos. Verifica que la URL y el host sean correctos.'
    } else if (msg.includes('does not exist') || msg.includes('relation')) {
      diagnostico.hint = 'Las tablas no existen. Llama /api/init-db para crearlas automáticamente.'
    } else if (msg.includes('P1003')) {
      diagnostico.hint = 'La base de datos no existe o las tablas no fueron creadas. Llama /api/init-db.'
    } else if (msg.includes('pgbouncer') || msg.includes('prepared statement')) {
      diagnostico.hint = 'Estás usando pgbouncer (pooler) que no soporta DDL. Las tablas deben crearse con conexión directa (DIRECT_URL).'
    }

    return NextResponse.json(diagnostico, { status: 500 })
  }

  // Test 2: Verificar si las tablas existen
  try {
    const tablas = ['Region', 'Campaign', 'AdSet', 'Lead', 'Metric', 'MetaCredential', 'CAPIEvent', 'ChatSession', 'Payment']
    const conteos: Record<string, number> = {}

    for (const tabla of tablas) {
      try {
        // @ts-expect-error - Dynamic model access
        conteos[tabla] = await db[tabla.charAt(0).toLowerCase() + tabla.slice(1)].count()
      } catch {
        conteos[tabla] = -1 // Tabla no existe
      }
    }

    diagnostico.tables = conteos
    diagnostico.tablesOk = Object.values(conteos).every(c => c >= 0)
  } catch (err) {
    diagnostico.tablesCheck = 'FAILED'
    diagnostico.tablesError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(diagnostico)
}
