// API de Pagos - ImmiScale Meta Engine v5
// Gestión de pagos multidivisa con múltiples gateways

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar pagos con información del lead, soporta filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir filtros dinámicamente
    const filtros: Record<string, unknown> = {}

    const estado = searchParams.get('status')
    if (estado) filtros.status = estado

    const gateway = searchParams.get('gateway')
    if (gateway) filtros.gateway = gateway

    const pagos = await db.payment.findMany({
      where: filtros,
      include: {
        lead: {
          include: {
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      exito: true,
      datos: pagos,
      total: pagos.length,
      filtros: {
        status: estado || null,
        gateway: gateway || null,
      },
    })
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo registro de pago
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()

    // Validar campos requeridos
    if (!cuerpo.leadId || cuerpo.amount === undefined) {
      return NextResponse.json(
        { exito: false, error: 'Los campos "leadId" y "amount" son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que el lead existe
    const lead = await db.lead.findUnique({
      where: { id: cuerpo.leadId },
      include: { region: true },
    })
    if (!lead) {
      return NextResponse.json(
        { exito: false, error: 'El lead especificado no existe' },
        { status: 404 }
      )
    }

    // Determinar moneda y tasa de cambio
    const moneda = cuerpo.currency || lead.region.currency || 'USD'
    const tasaCambio = cuerpo.exchangeRate || 1
    const montoUsd = moneda === 'USD' ? cuerpo.amount : cuerpo.amount / tasaCambio

    const nuevoPago = await db.payment.create({
      data: {
        leadId: cuerpo.leadId,
        amount: cuerpo.amount,
        currency: moneda,
        amountUsd: Math.round(montoUsd * 100) / 100,
        exchangeRate: tasaCambio,
        gateway: cuerpo.gateway || 'STRIPE',
        gatewayRefId: cuerpo.gatewayRefId || null,
        status: cuerpo.status || 'PENDING',
        description: cuerpo.description || null,
        paidAt: cuerpo.paidAt || null,
      },
      include: {
        lead: {
          include: {
            region: true,
          },
        },
      },
    })

    return NextResponse.json(
      { exito: true, datos: nuevoPago },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}
