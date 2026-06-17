import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const region = await db.region.update({ where: { id }, data: body })
    return NextResponse.json(region)
  } catch (error) {
    console.error('Error updating region:', error)
    return NextResponse.json({ message: 'Error al actualizar región' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.region.delete({ where: { id } })
    return NextResponse.json({ message: 'Región eliminada' })
  } catch (error) {
    console.error('Error deleting region:', error)
    return NextResponse.json({ message: 'Error al eliminar región' }, { status: 500 })
  }
}
