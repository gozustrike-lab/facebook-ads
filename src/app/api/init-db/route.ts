// API de Inicialización de DB - ImmiScale Meta Engine v5
// Crea las tablas automáticamente en Vercel (primer deploy)
// Llamar una vez después del deploy: curl https://tudominio.vercel.app/api/init-db

import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    // Ejecutar prisma db push para crear las tablas
    console.log('[InitDB] Creando tablas con prisma db push...')
    execSync('npx prisma db push --skip-generate', {
      stdio: 'pipe',
      env: { ...process.env },
    })

    console.log('[InitDB] Tablas creadas exitosamente')
    return NextResponse.json({
      exito: true,
      message: 'Base de datos inicializada correctamente. Tablas creadas.',
    })
  } catch (error) {
    console.error('[InitDB] Error al inicializar DB:', error)
    return NextResponse.json(
      {
        exito: false,
        error: `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        hint: 'Si estás en Vercel, verifica que DATABASE_URL apunte a una base de datos accesible. SQLite no es persistente en Vercel - usa PostgreSQL.',
      },
      { status: 500 }
    )
  }
}
