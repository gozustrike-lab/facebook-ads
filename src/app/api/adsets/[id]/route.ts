import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const adSet = await db.adSet.update({ where: { id }, data: body })
    return NextResponse.json(adSet)
  } catch (error) {
    console.error('Error updating adset:', error)
    return NextResponse.json({ message: 'Error al actualizar adset' }, { status: 500 })
  }
}
