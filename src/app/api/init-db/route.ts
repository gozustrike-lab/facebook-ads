// API de Inicialización de DB - ImmiScale Meta Engine v5
// Crea las tablas automáticamente en Vercel (primer deploy)
// Llamar una vez después del deploy: https://tudominio.vercel.app/api/init-db
// También se llama automáticamente desde el dashboard si las tablas no existen

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
      const msg = dbError instanceof Error ? dbError.message : String(dbError)
      results.push('ERROR: No se pudo conectar a la base de datos.')
      console.error('[InitDB] DB connection failed:', dbError)
      return NextResponse.json({
        exito: false,
        results,
        error: 'Base de datos no accesible.',
        hint: msg.includes('P1000') 
          ? 'Credenciales incorrectas. Si tu contraseña tiene @, reemplázalo por %40 en DATABASE_URL y DIRECT_URL.'
          : 'Verifica DATABASE_URL y DIRECT_URL en Vercel. Usa PostgreSQL (no SQLite) para Vercel serverless.',
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
      try {
        const existing = await db.region.findUnique({ where: { code: region.code } })
        if (!existing) {
          await db.region.create({ data: region })
          results.push(`Región creada: ${region.name} (${region.code})`)
        } else {
          results.push(`Región ya existe: ${region.name} (${region.code})`)
        }
      } catch (err) {
        results.push(`⚠️ Tabla Region no existe aún — prisma db push no se ejecutó. Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Step 3: Count existing records
    try {
      const [campaigns, adsets, leads, metrics] = await Promise.all([
        db.campaign.count(),
        db.adSet.count(),
        db.lead.count(),
        db.metric.count(),
      ])

      results.push(`Tablas disponibles: ${campaigns} campañas, ${adsets} adsets, ${leads} leads, ${metrics} métricas`)
    } catch (err) {
      results.push(`⚠️ Algunas tablas no existen aún: ${err instanceof Error ? err.message : String(err)}`)
    }

    console.log('[InitDB] Initialization complete:', results)

    return NextResponse.json({
      exito: true,
      message: 'Base de datos inicializada correctamente.',
      results,
    })
  } catch (error) {
    console.error('[InitDB] Error al inicializar DB:', error)
    return NextResponse.json(
      {
        exito: false,
        results,
        error: `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      },
      { status: 500 }
    )
  }
}
