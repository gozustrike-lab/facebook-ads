import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const events = await db.cAPIEvent.findMany({
      orderBy: { eventTime: 'desc' },
      take: 50,
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching CAPI events:', error)
    return NextResponse.json({ message: 'Error al obtener eventos CAPI' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const event = await db.cAPIEvent.create({
      data: {
        eventId: body.eventId || crypto.randomUUID(),
        eventName: body.eventName,
        sourceUrl: body.sourceUrl || null,
        country: body.country || null,
        userAgent: body.userAgent || null,
        ipHash: body.ipHash || null,
        fbclid: body.fbclid || null,
        fbp: body.fbp || null,
        sentToMeta: false,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating CAPI event:', error)
    return NextResponse.json({ message: 'Error al crear evento CAPI' }, { status: 500 })
  }
}
