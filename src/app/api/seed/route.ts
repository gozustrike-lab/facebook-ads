// API de Seed - ImmiScale Meta Engine v5
// Poblado de base de datos con datos demo realistas
// ¡CRÍTICO para demostraciones!

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =============================================
// POST - Sembrar la base de datos con datos demo
// =============================================
export async function POST() {
  try {
    // =============================================
    // 1. LIMPIAR DATOS EXISTENTES (orden inverso de dependencias)
    // =============================================
    await db.cAPIEvent.deleteMany()
    await db.metric.deleteMany()
    await db.payment.deleteMany()
    await db.lead.deleteMany()
    await db.adSet.deleteMany()
    await db.campaign.deleteMany()
    await db.region.deleteMany()
    await db.chatSession.deleteMany()

    // =============================================
    // 2. CREAR REGIONES
    // =============================================
    const regionUS = await db.region.create({
      data: {
        code: 'US',
        name: 'Estados Unidos',
        currency: 'USD',
        cplTarget: 25.0,
        cplKillSwitch: 37.5,
        language: 'es',
        isActive: true,
      },
    })

    const regionPE = await db.region.create({
      data: {
        code: 'PE',
        name: 'Perú',
        currency: 'PEN',
        cplTarget: 35.0,
        cplKillSwitch: 52.5,
        language: 'es',
        isActive: true,
      },
    })

    const regionCO = await db.region.create({
      data: {
        code: 'CO',
        name: 'Colombia',
        currency: 'COP',
        cplTarget: 40000.0,
        cplKillSwitch: 60000.0,
        language: 'es',
        isActive: true,
      },
    })

    const regionMX = await db.region.create({
      data: {
        code: 'MX',
        name: 'México',
        currency: 'MXN',
        cplTarget: 450.0,
        cplKillSwitch: 675.0,
        language: 'es',
        isActive: true,
      },
    })

    const regionGLOBAL = await db.region.create({
      data: {
        code: 'GLOBAL',
        name: 'Global',
        currency: 'USD',
        cplTarget: 30.0,
        cplKillSwitch: 45.0,
        language: 'es',
        isActive: true,
      },
    })

    // =============================================
    // 3. CREAR CAMPAÑAS
    // =============================================
    const campana1 = await db.campaign.create({
      data: {
        metaCampaignId: 'META-CAMP-001',
        name: 'Inmigración EE.UU. - Primavera 2025',
        objective: 'LEAD_GENERATION',
        status: 'ACTIVE',
        totalBudget: 15000,
        totalSpend: 8750.50,
        matchScore: 78.5,
        autoScale: true,
        lastScaledAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // Hace 48 horas
      },
    })

    const campana2 = await db.campaign.create({
      data: {
        metaCampaignId: 'META-CAMP-002',
        name: 'EB-2 NIW Latinoamérica - Q2 2025',
        objective: 'LEAD_GENERATION',
        status: 'ACTIVE',
        totalBudget: 12000,
        totalSpend: 5230.75,
        matchScore: 82.3,
        autoScale: true,
        lastScaledAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // Hace 72 horas
      },
    })

    // =============================================
    // 4. CREAR ADSETS
    // =============================================
    const adsets = []

    // Campaña 1: AdSets para EE.UU.
    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-001',
          name: 'US - Asilo Broad Audience',
          campaignId: campana1.id,
          regionId: regionUS.id,
          budget: 150.00,
          budgetCurrency: 'USD',
          dailySpend: 142.50,
          cpl: 22.30,
          leadCount: 6,
          audienceType: 'BROAD',
          status: 'ACTIVE',
          scaleDirection: 'V',
          lastBudgetInc: new Date(Date.now() - 36 * 60 * 60 * 1000),
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-002',
          name: 'US - Work Visa Lookalike',
          campaignId: campana1.id,
          regionId: regionUS.id,
          budget: 200.00,
          budgetCurrency: 'USD',
          dailySpend: 185.20,
          cpl: 18.75,
          leadCount: 10,
          audienceType: 'LOOKALIKE',
          status: 'ACTIVE',
          scaleDirection: null,
          lastBudgetInc: new Date(Date.now() - 50 * 60 * 60 * 1000),
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-003',
          name: 'US - DACA Custom Audience',
          campaignId: campana1.id,
          regionId: regionUS.id,
          budget: 100.00,
          budgetCurrency: 'USD',
          dailySpend: 98.50,
          cpl: 40.20,
          leadCount: 2,
          audienceType: 'CUSTOM',
          status: 'KILLED',
          killSwitchTriggered: true,
        },
      })
    )

    // Campaña 2: AdSets para Latinoamérica
    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-004',
          name: 'PE - EB-2 NIW Profesionales',
          campaignId: campana2.id,
          regionId: regionPE.id,
          budget: 500.00,
          budgetCurrency: 'PEN',
          dailySpend: 425.30,
          cpl: 28.50,
          leadCount: 15,
          audienceType: 'LOOKALIKE',
          status: 'ACTIVE',
          scaleDirection: 'V',
          lastBudgetInc: new Date(Date.now() - 30 * 60 * 60 * 1000),
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-005',
          name: 'CO - Inversores Broad',
          campaignId: campana2.id,
          regionId: regionCO.id,
          budget: 80000.00,
          budgetCurrency: 'COP',
          dailySpend: 65000.00,
          cpl: 35000.00,
          leadCount: 2,
          audienceType: 'BROAD',
          status: 'ACTIVE',
          scaleDirection: null,
          lastBudgetInc: null,
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-006',
          name: 'MX - Familia Custom',
          campaignId: campana2.id,
          regionId: regionMX.id,
          budget: 3000.00,
          budgetCurrency: 'MXN',
          dailySpend: 2800.00,
          cpl: 380.00,
          leadCount: 7,
          audienceType: 'CUSTOM',
          status: 'ACTIVE',
          scaleDirection: 'H',
          lastBudgetInc: new Date(Date.now() - 60 * 60 * 60 * 1000),
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-007',
          name: 'GLOBAL - NIW Multi-País',
          campaignId: campana2.id,
          regionId: regionGLOBAL.id,
          budget: 250.00,
          budgetCurrency: 'USD',
          dailySpend: 230.00,
          cpl: 26.80,
          leadCount: 9,
          audienceType: 'BROAD',
          status: 'LEARNING',
          scaleDirection: null,
          lastBudgetInc: null,
          killSwitchTriggered: false,
        },
      })
    )

    adsets.push(
      await db.adSet.create({
        data: {
          metaAdSetId: 'META-ADSET-008',
          name: 'PE - Asilo Lookalike',
          campaignId: campana2.id,
          regionId: regionPE.id,
          budget: 350.00,
          budgetCurrency: 'PEN',
          dailySpend: 340.00,
          cpl: 55.00,
          leadCount: 6,
          audienceType: 'LOOKALIKE',
          status: 'PAUSED',
          killSwitchTriggered: false,
        },
      })
    )

    // =============================================
    // 5. CREAR LEADS (~15)
    // =============================================
    const leads = []

    // Lead 1: US - IN_COUNTRY - Calificado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'María',
          lastName: 'González',
          email: 'maria.gonzalez@email.com',
          phone: '+1-305-555-0101',
          country: 'US',
          regionId: regionUS.id,
          route: 'IN_COUNTRY_US',
          visaType: 'ASILO',
          hasCriminalRecord: false,
          investmentCapacity: null,
          hasUniversityDegree: true,
          hasUsFamily: true,
          solvencyVerified: null,
          qualificationScore: 75,
          status: 'QUALIFIED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-001',
          notes: 'Caso de asilo fuerte, sin récord criminal',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 2: US - IN_COUNTRY - Nuevo
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Carlos',
          lastName: 'Martínez',
          email: 'carlos.m@email.com',
          phone: '+1-213-555-0202',
          country: 'US',
          regionId: regionUS.id,
          route: 'IN_COUNTRY_US',
          visaType: 'WORK',
          hasCriminalRecord: false,
          investmentCapacity: null,
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: null,
          qualificationScore: 60,
          status: 'NEW',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-002',
          notes: 'Interesado en H-1B, ingeniero de software',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 3: US - IN_COUNTRY - Contactado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Ana',
          lastName: 'Rodríguez',
          email: 'ana.r@email.com',
          phone: '+1-713-555-0303',
          country: 'US',
          regionId: regionUS.id,
          route: 'IN_COUNTRY_US',
          visaType: 'ASILO',
          hasCriminalRecord: false,
          investmentCapacity: null,
          hasUniversityDegree: false,
          hasUsFamily: true,
          solvencyVerified: null,
          qualificationScore: 55,
          status: 'CONTACTED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-001',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 4: PE - OUT_COUNTRY - Calificado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Jorge',
          lastName: 'Quispe',
          email: 'jorge.quispe@email.com',
          phone: '+51-999-555-0101',
          country: 'PE',
          regionId: regionPE.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'MEDIUM',
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: true,
          qualificationScore: 85,
          status: 'QUALIFIED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-004',
          notes: 'Ingeniero civil con maestría, excelente perfil EB-2 NIW',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 5: PE - OUT_COUNTRY - Pagado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Lucía',
          lastName: 'Mendoza',
          email: 'lucia.m@email.com',
          phone: '+51-999-555-0202',
          country: 'PE',
          regionId: regionPE.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'HIGH',
          hasUniversityDegree: true,
          hasUsFamily: true,
          solvencyVerified: true,
          qualificationScore: 92,
          status: 'PAID',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-004',
          notes: 'Médica con especialidad, ya pagó consulta inicial',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 6: CO - OUT_COUNTRY - Nuevo
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Andrés',
          lastName: 'López',
          email: 'andres.l@email.com',
          phone: '+57-310-555-0101',
          country: 'CO',
          regionId: regionCO.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'MEDIUM',
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: true,
          qualificationScore: 70,
          status: 'NEW',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-005',
          notes: 'Arquitecto con experiencia internacional',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 7: CO - OUT_COUNTRY - Descalificado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Pedro',
          lastName: 'García',
          email: 'pedro.g@email.com',
          phone: '+57-320-555-0202',
          country: 'CO',
          regionId: regionCO.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'OTHER',
          hasCriminalRecord: true,
          investmentCapacity: 'LOW',
          hasUniversityDegree: false,
          hasUsFamily: false,
          solvencyVerified: false,
          qualificationScore: 15,
          status: 'DISQUALIFIED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-005',
          notes: 'Perfil no califica bajo ninguna ruta estándar',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 8: MX - OUT_COUNTRY - Calificado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Sofía',
          lastName: 'Hernández',
          email: 'sofia.h@email.com',
          phone: '+52-555-555-0101',
          country: 'MX',
          regionId: regionMX.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'FAMILY',
          hasCriminalRecord: false,
          investmentCapacity: 'MEDIUM',
          hasUniversityDegree: true,
          hasUsFamily: true,
          solvencyVerified: true,
          qualificationScore: 78,
          status: 'QUALIFIED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-006',
          notes: 'Hermana es ciudadana americana, petición familiar',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 9: MX - OUT_COUNTRY - Nuevo
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Roberto',
          lastName: 'Díaz',
          email: 'roberto.d@email.com',
          phone: '+52-333-555-0202',
          country: 'MX',
          regionId: regionMX.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'LOW',
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: false,
          qualificationScore: 45,
          status: 'NEW',
          source: 'ORGANIC',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 10: GLOBAL - OUT_COUNTRY - Contactado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Elena',
          lastName: 'Petrova',
          email: 'elena.p@email.com',
          phone: '+7-916-555-0101',
          country: 'GLOBAL',
          regionId: regionGLOBAL.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'HIGH',
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: true,
          qualificationScore: 80,
          status: 'CONTACTED',
          source: 'REFERRAL',
          notes: 'Referida por cliente existente, científica de datos',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 11: US - IN_COUNTRY - Perdido
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Miguel',
          lastName: 'Torres',
          email: 'miguel.t@email.com',
          phone: '+1-956-555-0404',
          country: 'US',
          regionId: regionUS.id,
          route: 'IN_COUNTRY_US',
          visaType: 'WORK',
          hasCriminalRecord: true,
          investmentCapacity: null,
          hasUniversityDegree: false,
          hasUsFamily: false,
          solvencyVerified: null,
          qualificationScore: 20,
          status: 'LOST',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-003',
          notes: 'Récord criminal complicado, decidió no proceder',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 12: PE - OUT_COUNTRY - Contactado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Rosa',
          lastName: 'Flores',
          email: 'rosa.f@email.com',
          phone: '+51-988-555-0303',
          country: 'PE',
          regionId: regionPE.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'FAMILY',
          hasCriminalRecord: false,
          investmentCapacity: 'LOW',
          hasUniversityDegree: false,
          hasUsFamily: true,
          solvencyVerified: false,
          qualificationScore: 50,
          status: 'CONTACTED',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-008',
          notes: 'Esposo es residente, posible petición familiar',
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 13: GLOBAL - Calificado via chatbot
    leads.push(
      await db.lead.create({
        data: {
          firstName: null,
          lastName: null,
          email: null,
          phone: null,
          country: 'AR',
          regionId: regionGLOBAL.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'HIGH',
          hasUniversityDegree: true,
          hasUsFamily: false,
          solvencyVerified: true,
          qualificationScore: 88,
          status: 'QUALIFIED',
          source: 'CHATBOT',
          notes: 'Pre-calificación automática: ALTA_PROBABILIDAD',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 14: CO - Nuevo
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Valentina',
          lastName: 'Ruiz',
          email: 'valentina.r@email.com',
          phone: '+57-315-555-0303',
          country: 'CO',
          regionId: regionCO.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'EB2_NIW',
          hasCriminalRecord: false,
          investmentCapacity: 'MEDIUM',
          hasUniversityDegree: true,
          hasUsFamily: true,
          solvencyVerified: true,
          qualificationScore: 72,
          status: 'NEW',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-005',
          notes: 'Abogada con maestría en derecho internacional',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      })
    )

    // Lead 15: MX - Pagado
    leads.push(
      await db.lead.create({
        data: {
          firstName: 'Fernando',
          lastName: 'Castro',
          email: 'fernando.c@email.com',
          phone: '+52-811-555-0303',
          country: 'MX',
          regionId: regionMX.id,
          route: 'OUT_COUNTRY_GLOBAL',
          visaType: 'FAMILY',
          hasCriminalRecord: false,
          investmentCapacity: 'HIGH',
          hasUniversityDegree: true,
          hasUsFamily: true,
          solvencyVerified: true,
          qualificationScore: 90,
          status: 'PAID',
          source: 'META_ADS',
          metaAdId: 'META-ADSET-006',
          notes: 'Padre ciudadano, ya pagó consulta completa',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // =============================================
    // 6. CREAR PAGOS (~8)
    // =============================================
    const pagos = []

    // Pago 1: Lucía (PE) - Completado en PEN via Niubiz
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[4].id, // Lucía Mendoza
          amount: 500.00,
          currency: 'PEN',
          amountUsd: 133.33,
          exchangeRate: 3.75,
          gateway: 'NIUBIZ',
          gatewayRefId: 'NBZ-PE-001',
          status: 'COMPLETED',
          description: 'Consulta inicial EB-2 NIW',
          paidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Pago 2: Lucía (PE) - Segundo pago completado via MercadoPago
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[4].id, // Lucía Mendoza
          amount: 2500.00,
          currency: 'PEN',
          amountUsd: 666.67,
          exchangeRate: 3.75,
          gateway: 'MERCADO_PAGO',
          gatewayRefId: 'MP-PE-002',
          status: 'COMPLETED',
          description: 'Servicio completo EB-2 NIW - Primera cuota',
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Pago 3: Fernando (MX) - Completado en MXN via Stripe
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[14].id, // Fernando Castro
          amount: 8000.00,
          currency: 'MXN',
          amountUsd: 470.59,
          exchangeRate: 17.0,
          gateway: 'STRIPE',
          gatewayRefId: 'STP-MX-001',
          status: 'COMPLETED',
          description: 'Consulta completa petición familiar',
          paidAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Pago 4: Andrés (CO) - Pendiente en COP via Culqi
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[5].id, // Andrés López
          amount: 350000.00,
          currency: 'COP',
          amountUsd: 81.40,
          exchangeRate: 4300.0,
          gateway: 'CULQI',
          gatewayRefId: null,
          status: 'PENDING',
          description: 'Consulta inicial EB-2 NIW',
        },
      })
    )

    // Pago 5: María (US) - Completado en USD via Stripe
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[0].id, // María González
          amount: 250.00,
          currency: 'USD',
          amountUsd: 250.00,
          exchangeRate: 1.0,
          gateway: 'STRIPE',
          gatewayRefId: 'STP-US-001',
          status: 'COMPLETED',
          description: 'Consulta asilo político',
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Pago 6: Sofia (MX) - Fallido en MXN
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[7].id, // Sofía Hernández
          amount: 5000.00,
          currency: 'MXN',
          amountUsd: 294.12,
          exchangeRate: 17.0,
          gateway: 'STRIPE',
          gatewayRefId: 'STP-MX-002',
          status: 'FAILED',
          description: 'Consulta petición familiar - tarjeta declinada',
        },
      })
    )

    // Pago 7: Elena (GLOBAL) - Completado en USD via Stripe
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[9].id, // Elena Petrova
          amount: 350.00,
          currency: 'USD',
          amountUsd: 350.00,
          exchangeRate: 1.0,
          gateway: 'STRIPE',
          gatewayRefId: 'STP-GL-001',
          status: 'COMPLETED',
          description: 'Consulta EB-2 NIW - pago internacional',
          paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // Pago 8: Carlos (US) - Reembolsado
    pagos.push(
      await db.payment.create({
        data: {
          leadId: leads[1].id, // Carlos Martínez
          amount: 150.00,
          currency: 'USD',
          amountUsd: 150.00,
          exchangeRate: 1.0,
          gateway: 'STRIPE',
          gatewayRefId: 'STP-US-002',
          status: 'REFUNDED',
          description: 'Consulta H-1B - reembolso solicitado',
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      })
    )

    // =============================================
    // 7. CREAR MÉTRICAS (últimos 7 días por región)
    // =============================================
    const fechaBase = new Date()
    fechaBase.setHours(0, 0, 0, 0)

    // Datos de métricas por región y día
    const datosMetricas: {
      regionId: string
      regionCode: string
      dias: {
        offset: number
        totalSpend: number
        leadCount: number
        qualifiedCount: number
        paidCount: number
        cpql: number
        cpl: number
        revenue: number
        matchScore: number
      }[]
    }[] = [
      {
        regionId: regionUS.id,
        regionCode: 'US',
        dias: [
          { offset: 6, totalSpend: 380, leadCount: 15, qualifiedCount: 9, paidCount: 2, cpql: 42.2, cpl: 25.3, revenue: 500, matchScore: 75.0 },
          { offset: 5, totalSpend: 420, leadCount: 18, qualifiedCount: 11, paidCount: 3, cpql: 38.2, cpl: 23.3, revenue: 750, matchScore: 78.0 },
          { offset: 4, totalSpend: 350, leadCount: 14, qualifiedCount: 8, paidCount: 1, cpql: 43.8, cpl: 25.0, revenue: 250, matchScore: 72.0 },
          { offset: 3, totalSpend: 395, leadCount: 16, qualifiedCount: 10, paidCount: 2, cpql: 39.5, cpl: 24.7, revenue: 500, matchScore: 76.0 },
          { offset: 2, totalSpend: 410, leadCount: 17, qualifiedCount: 12, paidCount: 4, cpql: 34.2, cpl: 24.1, revenue: 1000, matchScore: 80.0 },
          { offset: 1, totalSpend: 430, leadCount: 19, qualifiedCount: 13, paidCount: 3, cpql: 33.1, cpl: 22.6, revenue: 750, matchScore: 82.0 },
          { offset: 0, totalSpend: 327.70, leadCount: 18, qualifiedCount: 12, paidCount: 2, cpql: 27.3, cpl: 18.2, revenue: 500, matchScore: 78.5 },
        ],
      },
      {
        regionId: regionPE.id,
        regionCode: 'PE',
        dias: [
          { offset: 6, totalSpend: 1200, leadCount: 20, qualifiedCount: 14, paidCount: 3, cpql: 85.7, cpl: 60.0, revenue: 1500, matchScore: 80.0 },
          { offset: 5, totalSpend: 1350, leadCount: 22, qualifiedCount: 16, paidCount: 4, cpql: 84.4, cpl: 61.4, revenue: 2000, matchScore: 82.0 },
          { offset: 4, totalSpend: 1100, leadCount: 18, qualifiedCount: 12, paidCount: 2, cpql: 91.7, cpl: 61.1, revenue: 1000, matchScore: 78.0 },
          { offset: 3, totalSpend: 1250, leadCount: 21, qualifiedCount: 15, paidCount: 3, cpql: 83.3, cpl: 59.5, revenue: 1500, matchScore: 81.0 },
          { offset: 2, totalSpend: 1300, leadCount: 23, qualifiedCount: 17, paidCount: 5, cpql: 76.5, cpl: 56.5, revenue: 2500, matchScore: 84.0 },
          { offset: 1, totalSpend: 1400, leadCount: 25, qualifiedCount: 18, paidCount: 4, cpql: 77.8, cpl: 56.0, revenue: 2000, matchScore: 83.0 },
          { offset: 0, totalSpend: 425.30, leadCount: 15, qualifiedCount: 10, paidCount: 2, cpql: 42.5, cpl: 28.5, revenue: 1000, matchScore: 82.3 },
        ],
      },
      {
        regionId: regionCO.id,
        regionCode: 'CO',
        dias: [
          { offset: 6, totalSpend: 180000, leadCount: 3, qualifiedCount: 2, paidCount: 0, cpql: 90000, cpl: 60000, revenue: 0, matchScore: 65.0 },
          { offset: 5, totalSpend: 195000, leadCount: 4, qualifiedCount: 2, paidCount: 1, cpql: 97500, cpl: 48750, revenue: 350000, matchScore: 68.0 },
          { offset: 4, totalSpend: 170000, leadCount: 3, qualifiedCount: 1, paidCount: 0, cpql: 170000, cpl: 56667, revenue: 0, matchScore: 62.0 },
          { offset: 3, totalSpend: 200000, leadCount: 5, qualifiedCount: 3, paidCount: 1, cpql: 66667, cpl: 40000, revenue: 350000, matchScore: 70.0 },
          { offset: 2, totalSpend: 210000, leadCount: 5, qualifiedCount: 3, paidCount: 0, cpql: 70000, cpl: 42000, revenue: 0, matchScore: 71.0 },
          { offset: 1, totalSpend: 185000, leadCount: 4, qualifiedCount: 3, paidCount: 1, cpql: 61667, cpl: 46250, revenue: 350000, matchScore: 69.0 },
          { offset: 0, totalSpend: 65000, leadCount: 2, qualifiedCount: 1, paidCount: 0, cpql: 65000, cpl: 32500, revenue: 0, matchScore: 67.0 },
        ],
      },
      {
        regionId: regionMX.id,
        regionCode: 'MX',
        dias: [
          { offset: 6, totalSpend: 7200, leadCount: 12, qualifiedCount: 7, paidCount: 1, cpql: 1028.6, cpl: 600, revenue: 8000, matchScore: 74.0 },
          { offset: 5, totalSpend: 7800, leadCount: 14, qualifiedCount: 9, paidCount: 2, cpql: 866.7, cpl: 557.1, revenue: 16000, matchScore: 76.0 },
          { offset: 4, totalSpend: 6500, leadCount: 10, qualifiedCount: 6, paidCount: 1, cpql: 1083.3, cpl: 650, revenue: 8000, matchScore: 72.0 },
          { offset: 3, totalSpend: 7100, leadCount: 13, qualifiedCount: 8, paidCount: 2, cpql: 887.5, cpl: 546.2, revenue: 16000, matchScore: 75.0 },
          { offset: 2, totalSpend: 7500, leadCount: 14, qualifiedCount: 10, paidCount: 3, cpql: 750, cpl: 535.7, revenue: 24000, matchScore: 78.0 },
          { offset: 1, totalSpend: 7800, leadCount: 15, qualifiedCount: 11, paidCount: 2, cpql: 709.1, cpl: 520, revenue: 16000, matchScore: 77.0 },
          { offset: 0, totalSpend: 2800, leadCount: 7, qualifiedCount: 5, paidCount: 1, cpql: 560, cpl: 400, revenue: 8000, matchScore: 76.0 },
        ],
      },
      {
        regionId: regionGLOBAL.id,
        regionCode: 'GLOBAL',
        dias: [
          { offset: 6, totalSpend: 180, leadCount: 6, qualifiedCount: 4, paidCount: 1, cpql: 45, cpl: 30, revenue: 350, matchScore: 80.0 },
          { offset: 5, totalSpend: 210, leadCount: 7, qualifiedCount: 5, paidCount: 1, cpql: 42, cpl: 30, revenue: 350, matchScore: 82.0 },
          { offset: 4, totalSpend: 170, leadCount: 5, qualifiedCount: 3, paidCount: 0, cpql: 56.7, cpl: 34, revenue: 0, matchScore: 78.0 },
          { offset: 3, totalSpend: 200, leadCount: 7, qualifiedCount: 5, paidCount: 2, cpql: 40, cpl: 28.6, revenue: 700, matchScore: 81.0 },
          { offset: 2, totalSpend: 220, leadCount: 8, qualifiedCount: 6, paidCount: 1, cpql: 36.7, cpl: 27.5, revenue: 350, matchScore: 83.0 },
          { offset: 1, totalSpend: 230, leadCount: 8, qualifiedCount: 6, paidCount: 2, cpql: 38.3, cpl: 28.8, revenue: 700, matchScore: 82.0 },
          { offset: 0, totalSpend: 230, leadCount: 9, qualifiedCount: 7, paidCount: 1, cpql: 32.9, cpl: 25.6, revenue: 350, matchScore: 82.3 },
        ],
      },
    ]

    for (const datosRegion of datosMetricas) {
      for (const dia of datosRegion.dias) {
        const fecha = new Date(fechaBase)
        fecha.setDate(fecha.getDate() - dia.offset)

        await db.metric.create({
          data: {
            regionId: datosRegion.regionId,
            date: fecha,
            totalSpend: dia.totalSpend,
            leadCount: dia.leadCount,
            qualifiedCount: dia.qualifiedCount,
            paidCount: dia.paidCount,
            cpql: dia.cpql,
            cpl: dia.cpl,
            revenue: dia.revenue,
            matchScore: dia.matchScore,
            currency: datosRegion.regionCode === 'US' || datosRegion.regionCode === 'GLOBAL'
              ? 'USD'
              : datosRegion.regionCode === 'PE'
                ? 'PEN'
                : datosRegion.regionCode === 'CO'
                  ? 'COP'
                  : 'MXN',
          },
        })
      }
    }

    // =============================================
    // 8. CREAR EVENTOS CAPI
    // =============================================
    const eventosCAPI = [
      {
        eventId: 'capi-evt-001',
        eventName: 'Lead',
        sourceUrl: 'https://immiscale.com/chatbot',
        country: 'PE',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        fbclid: 'fb.1.1717400000.Abc123',
        fbp: 'fb.1.1717400000.1234567890',
        sentToMeta: true,
        metaResponse: 'SIMULATED_SUCCESS',
        eventTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        eventId: 'capi-evt-002',
        eventName: 'Lead',
        sourceUrl: 'https://immiscale.com/chatbot',
        country: 'CO',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)',
        fbclid: null,
        fbp: 'fb.1.1717410000.0987654321',
        sentToMeta: true,
        metaResponse: 'SIMULATED_SUCCESS',
        eventTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        eventId: 'capi-evt-003',
        eventName: 'Purchase',
        sourceUrl: 'https://immiscale.com/pago-confirmado',
        country: 'US',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        fbclid: 'fb.1.1717420000.Xyz789',
        fbp: null,
        sentToMeta: true,
        metaResponse: 'SIMULATED_SUCCESS',
        eventTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        eventId: 'capi-evt-004',
        eventName: 'CompleteRegistration',
        sourceUrl: 'https://immiscale.com/registro',
        country: 'MX',
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        fbclid: null,
        fbp: 'fb.1.1717430000.5678901234',
        sentToMeta: false,
        metaResponse: null,
        eventTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        eventId: 'capi-evt-005',
        eventName: 'Lead',
        sourceUrl: 'https://immiscale.com/chatbot',
        country: 'PE',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        fbclid: 'fb.1.1717440000.Def456',
        fbp: 'fb.1.1717440000.1122334455',
        sentToMeta: true,
        metaResponse: 'SIMULATED_SUCCESS',
        eventTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ]

    for (const evento of eventosCAPI) {
      await db.cAPIEvent.create({ data: evento })
    }

    // =============================================
    // RESPUESTA FINAL
    // =============================================
    return NextResponse.json({
      exito: true,
      mensaje: 'Base de datos sembrada exitosamente con datos demo',
      resumen: {
        regiones: 5,
        campanas: 2,
        adsets: adsets.length,
        leads: leads.length,
        pagos: pagos.length,
        metricas: datosMetricas.reduce((acc, d) => acc + d.dias.length, 0),
        eventosCAPI: eventosCAPI.length,
      },
    })
  } catch (error) {
    console.error('Error al sembrar base de datos:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al sembrar base de datos', detalles: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
