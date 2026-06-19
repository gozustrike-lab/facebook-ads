// API de Regiones - ImmiScale Meta Engine v5
// SAFE: Returns [] on empty DB instead of 500

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const regions = await db.region.findMany({ orderBy: { code: 'asc' } })
    return NextResponse.json(regions)
  } catch (error) {
    console.error('Error fetching regions:', error)
    // Graceful fallback: return empty array instead of 500
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.code || !body.name) {
      return NextResponse.json({ message: 'Los campos "code" y "name" son obligatorios' }, { status: 400 })
    }
    const existing = await db.region.findUnique({ where: { code: body.code } })
    if (existing) {
      return NextResponse.json({ message: `Ya existe una región con el código "${body.code}"` }, { status: 409 })
    }
    const region = await db.region.create({
      data: {
        code: body.code,
        name: body.name,
        currency: body.currency || 'USD',
        cplTarget: body.cplTarget || 25.0,
        cplKillSwitch: body.cplKillSwitch || 37.5,
        language: body.language || 'es',
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })
    return NextResponse.json(region, { status: 201 })
  } catch (error) {
    console.error('Error creating region:', error)
    return NextResponse.json(
      { message: 'Error al crear región. Verifica que la base de datos esté inicializada.' },
      { status: 500 }
    )
  }
}
