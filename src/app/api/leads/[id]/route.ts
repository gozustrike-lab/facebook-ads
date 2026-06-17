import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const lead = await db.lead.update({
      where: { id },
      data: body,
      include: { region: true, payments: true },
    })
    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ message: 'Error al actualizar lead' }, { status: 500 })
  }
}
