// API de Inicialización de DB - ImmiScale Meta Engine v5
// Crea las tablas automáticamente en Vercel (primer deploy)
// Llamar una vez después del deploy: curl https://tudominio.vercel.app/api/init-db
// SAFE: Uses Prisma client directly instead of child_process

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const results: string[] = []

  try {
    // Step 1: Verify DB connection by trying a simple query
    try {
      await db.$queryRaw`SELECT 1`
      results.push('Conexión a la base de datos verificada')
    } catch (dbError) {
      results.push('ERROR: No se pudo conectar a la base de datos. Verifica DATABASE_URL.')
      console.error('[InitDB] DB connection failed:', dbError)
      return NextResponse.json({
        exito: false,
        results,
        error: 'Base de datos no accesible. Para Vercel, usa PostgreSQL (no SQLite).',
        hint: 'Configura DATABASE_URL con una conexión PostgreSQL externa como Vercel Postgres, Neon, o Supabase.',
      }, { status: 500 })
    }

    // Step 2: Seed default regions if they don't exist
    const defaultRegions = [
      { code: 'US', name: 'Estados Unidos', currency: 'USD', cplTarget: 25.0, cplKillSwitch: 37.5, language: 'es' },
      { code: 'PE', name: 'Perú', currency: 'PEN', cplTarget: 15.0, cplKillSwitch: 22.5, language: 'es' },
      { code: 'CO', name: 'Colombia', currency: 'COP', cplTarget: 18.0, cplKillSwitch: 27.0, language: 'es' },
      { code: 'MX', name: 'México', currency: 'MXN', cplTarget: 20.0, cplKillSwitch: 30.0, language: 'es' },
      { code: 'GLOBAL', name: 'Global / Otros', currency: 'USD', cplTarget: 30.0, cplKillSwitch: 45.0, language: 'es' },
    ]

    for (const region of defaultRegions) {
      const existing = await db.region.findUnique({ where: { code: region.code } })
      if (!existing) {
        await db.region.create({ data: region })
        results.push(`Región creada: ${region.name} (${region.code})`)
      } else {
        results.push(`Región ya existe: ${region.name} (${region.code})`)
      }
    }

    // Step 3: Count existing records
    const [campaigns, adsets, leads, metrics] = await Promise.all([
      db.campaign.count(),
      db.adSet.count(),
      db.lead.count(),
      db.metric.count(),
    ])

    results.push(`Tablas disponibles: ${campaigns} campañas, ${adsets} adsets, ${leads} leads, ${metrics} métricas`)

    console.log('[InitDB] Initialization complete:', results)

    return NextResponse.json({
      exito: true,
      message: 'Base de datos inicializada correctamente.',
      results,
      stats: { campaigns, adsets, leads, metrics },
    })
  } catch (error) {
    console.error('[InitDB] Error al inicializar DB:', error)
    return NextResponse.json(
      {
        exito: false,
        results,
        error: `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        hint: 'Si estás en Vercel, SQLite no es persistente. Configura DATABASE_URL con PostgreSQL.',
      },
      { status: 500 }
    )
  }
}
