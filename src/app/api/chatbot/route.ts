// API de Chatbot - ImmiScale Meta Engine v5
// Chatbot de pre-calificación inmobiliaria con máquina de estados
// Rutas: IN_COUNTRY_US (asilo, visas trabajo, estatus, récord criminal)
//        OUT_COUNTRY_GLOBAL (inversión, EB-2 NIW, familiares en EE.UU., solvencia)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =============================================
// Definición de pasos del flujo de conversación
// =============================================
type PasoConversacion =
  | 'GREETING'
  | 'COUNTRY_DETECT'
  | 'ROUTE_ASSIGN'
  | 'QUALIFICATION_QUESTIONS'
  | 'RESULT'

// Preguntas de calificación según la ruta
const PREGUNTAS_IN_COUNTRY_US: Record<string, { campo: string; pregunta: string; opciones?: string[] }> = {
  Q_ASILO: {
    campo: 'asiloInterest',
    pregunta: '¿Estás buscando protección bajo asilo o refugio en Estados Unidos?',
    opciones: ['Sí', 'No'],
  },
  Q_VISA_TRABAJO: {
    campo: 'workVisaInterest',
    pregunta: '¿Estás interesado/a en una visa de trabajo (H-1B, H-2B, L-1, O-1)?',
    opciones: ['Sí', 'No'],
  },
  Q_ESTATUS: {
    campo: 'currentStatus',
    pregunta: '¿Cuál es tu estatus migratorio actual?',
    opciones: ['Indocumentado/a', 'Visa de turista', 'TPS', 'DACA', 'Residente', 'Ciudadano', 'Otro'],
  },
  Q_RECORD_CRIMINAL: {
    campo: 'hasCriminalRecord',
    pregunta: '¿Tienes algún récord criminal o historial de arrestos?',
    opciones: ['Sí', 'No'],
  },
}

const PREGUNTAS_OUT_COUNTRY_GLOBAL: Record<string, { campo: string; pregunta: string; opciones?: string[] }> = {
  Q_INVERSION: {
    campo: 'investmentCapacity',
    pregunta: '¿Cuál es tu capacidad de inversión para un proceso migratorio?',
    opciones: ['Alta (más de $50,000 USD)', 'Media ($10,000 - $50,000 USD)', 'Baja (menos de $10,000 USD)'],
  },
  Q_UNIVERSIDAD: {
    campo: 'hasUniversityDegree',
    pregunta: '¿Tienes un título universitario (licenciatura o posgrado)?',
    opciones: ['Sí', 'No'],
  },
  Q_FAMILIA_US: {
    campo: 'hasUsFamily',
    pregunta: '¿Tienes familiares que sean ciudadanos o residentes de EE.UU.?',
    opciones: ['Sí', 'No'],
  },
  Q_SOLVENCIA: {
    campo: 'solvencyVerified',
    pregunta: '¿Puedes demostrar solvencia económica (estados de cuenta, propiedades, negocios)?',
    opciones: ['Sí', 'No'],
  },
}

// Mapeo de pasos de pregunta a la siguiente pregunta
const FLUJO_IN_COUNTRY_US = ['Q_ASILO', 'Q_VISA_TRABAJO', 'Q_ESTATUS', 'Q_RECORD_CRIMINAL']
const FLUJO_OUT_COUNTRY_GLOBAL = ['Q_INVERSION', 'Q_UNIVERSIDAD', 'Q_FAMILIA_US', 'Q_SOLVENCIA']

// =============================================
// Funciones auxiliares
// =============================================

// Determinar la ruta según el país del visitante
function determinarRuta(pais: string): 'IN_COUNTRY_US' | 'OUT_COUNTRY_GLOBAL' {
  if (pais.toUpperCase() === 'US') {
    return 'IN_COUNTRY_US'
  }
  return 'OUT_COUNTRY_GLOBAL'
}

// Obtener la pregunta actual según el paso y la ruta
function obtenerPreguntaActual(
  paso: string,
  ruta: string
): { campo: string; pregunta: string; opciones?: string[] } | null {
  let flujo: string[]
  let preguntas: Record<string, { campo: string; pregunta: string; opciones?: string[] }>

  if (ruta === 'IN_COUNTRY_US') {
    flujo = FLUJO_IN_COUNTRY_US
    preguntas = PREGUNTAS_IN_COUNTRY_US
  } else {
    flujo = FLUJO_OUT_COUNTRY_GLOBAL
    preguntas = PREGUNTAS_OUT_COUNTRY_GLOBAL
  }

  // Buscar la pregunta correspondiente al paso actual
  const indicePaso = flujo.indexOf(paso)
  if (indicePaso === -1) return null

  return preguntas[flujo[indicePaso]] || null
}

// Obtener el siguiente paso de pregunta
function obtenerSiguientePaso(pasoActual: string, ruta: string): string | null {
  let flujo: string[]

  if (ruta === 'IN_COUNTRY_US') {
    flujo = FLUJO_IN_COUNTRY_US
  } else {
    flujo = FLUJO_OUT_COUNTRY_GLOBAL
  }

  const indiceActual = flujo.indexOf(pasoActual)
  if (indiceActual === -1 || indiceActual >= flujo.length - 1) {
    return null // No hay más preguntas, ir a RESULT
  }
  return flujo[indiceActual + 1]
}

// Calcular puntuación de calificación basada en las respuestas
function calcularCalificacion(
  respuestas: Record<string, string>,
  ruta: string
): { score: number; visaType: string; resultado: string } {
  let score = 0
  let visaType = 'OTHER'

  if (ruta === 'IN_COUNTRY_US') {
    // Evaluar ruta IN_COUNTRY_US
    if (respuestas.asiloInterest === 'Sí' || respuestas.asiloInterest === 'Si') {
      score += 30
      visaType = 'ASILO'
    }
    if (respuestas.workVisaInterest === 'Sí' || respuestas.workVisaInterest === 'Si') {
      score += 25
      if (visaType === 'OTHER') visaType = 'WORK'
    }
    if (respuestas.currentStatus && !['Indocumentado/a'].includes(respuestas.currentStatus)) {
      score += 20
    }
    if (respuestas.hasCriminalRecord === 'false') {
      score += 25
    } else if (respuestas.hasCriminalRecord === 'true') {
      score -= 15
    }
  } else {
    // Evaluar ruta OUT_COUNTRY_GLOBAL - usa valores mapeados (HIGH/MEDIUM/LOW, true/false)
    if (respuestas.investmentCapacity) {
      if (respuestas.investmentCapacity === 'HIGH') {
        score += 35
        visaType = 'EB5'
      } else if (respuestas.investmentCapacity === 'MEDIUM') {
        score += 20
      } else if (respuestas.investmentCapacity === 'LOW') {
        score += 5
      } else if (respuestas.investmentCapacity.startsWith('Alta')) {
        // Compatibilidad con formato original
        score += 35
        visaType = 'EB5'
      } else if (respuestas.investmentCapacity.startsWith('Media')) {
        score += 20
      } else {
        score += 5
      }
    }
    if (respuestas.hasUniversityDegree === 'true') {
      score += 30
      if (visaType === 'OTHER' || visaType === 'EB5') visaType = 'EB2_NIW'
    }
    if (respuestas.hasUsFamily === 'true') {
      score += 20
      if (visaType === 'OTHER') visaType = 'FAMILY'
    }
    if (respuestas.solvencyVerified === 'true') {
      score += 15
    }
  }

  // Determinar resultado
  let resultado: string
  if (score >= 60) {
    resultado = 'ALTA_PROBABILIDAD'
  } else if (score >= 35) {
    resultado = 'PROBABILIDAD_MEDIA'
  } else {
    resultado = 'BAJA_PROBABILIDAD'
  }

  return { score, visaType, resultado }
}

// =============================================
// Handler principal del chatbot
// =============================================

interface RespuestaChatbot {
  reply: string
  nextStep: PasoConversacion
  route?: string
  completed: boolean
  qualificationResult?: {
    score: number
    visaType: string
    resultado: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json()
    const { visitorId, message, country, currentStep } = cuerpo as {
      visitorId: string
      message: string
      country?: string
      currentStep?: PasoConversacion
    }

    // Validar campos requeridos
    if (!visitorId) {
      return NextResponse.json(
        { exito: false, error: 'El campo "visitorId" es obligatorio' },
        { status: 400 }
      )
    }

    // Buscar o crear sesión del chatbot
    let sesion = await db.chatSession.findFirst({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
    })

    // Determinar el paso actual (de la sesión existente o del request)
    const paso: PasoConversacion = (sesion?.currentStep as PasoConversacion) || currentStep || 'GREETING'
    const pais = country || sesion?.country || null
    const ruta = sesion?.route || null

    // Inicializar respuestas existentes
    let respuestas: Record<string, string> = {}
    if (sesion?.answersJson) {
      try {
        respuestas = JSON.parse(sesion.answersJson)
      } catch {
        respuestas = {}
      }
    }

    // =============================================
    // Máquina de estados del chatbot
    // =============================================
    const respuesta: RespuestaChatbot = {
      reply: '',
      nextStep: paso,
      completed: false,
    }

    switch (paso) {
      case 'GREETING': {
        // Paso inicial: saludo y detección de país
        respuesta.reply = '¡Hola! 👋 Bienvenido/a al sistema de pre-calificación migratoria de ImmiScale. Para comenzar, ¿en qué país te encuentras actualmente? (Ej: US, PE, CO, MX, etc.)'
        respuesta.nextStep = 'COUNTRY_DETECT'

        // Crear o actualizar sesión
        if (sesion) {
          await db.chatSession.update({
            where: { id: sesion.id },
            data: { currentStep: 'COUNTRY_DETECT' },
          })
        } else {
          sesion = await db.chatSession.create({
            data: {
              visitorId,
              currentStep: 'COUNTRY_DETECT',
            },
          })
        }
        break
      }

      case 'COUNTRY_DETECT': {
        // Detectar país del mensaje del usuario
        const paisDetectado = pais || extraerPaisDelMensaje(message)

        if (!paisDetectado) {
          respuesta.reply = 'No pude detectar tu país. Por favor, indícame el código de tu país (Ej: US para Estados Unidos, PE para Perú, CO para Colombia, MX para México).'
          respuesta.nextStep = 'COUNTRY_DETECT'
          break
        }

        const rutaAsignada = determinarRuta(paisDetectado)
        respuesta.route = rutaAsignada
        respuesta.nextStep = 'ROUTE_ASSIGN'

        // Actualizar sesión con país y ruta
        if (sesion) {
          await db.chatSession.update({
            where: { id: sesion.id },
            data: {
              country: paisDetectado.toUpperCase(),
              route: rutaAsignada,
              currentStep: 'ROUTE_ASSIGN',
            },
          })
        }

        if (rutaAsignada === 'IN_COUNTRY_US') {
          respuesta.reply = `Te encuentras en Estados Unidos 🇺🇸. Te asignaremos la ruta de atención **IN_COUNTRY_US**, enfocada en:
- Asilo y refugio
- Visas de trabajo (H-1B, L-1, etc.)
- Estatus migratorio actual
- Récord criminal

¿Deseas continuar con la pre-calificación? (Sí/No)`
        } else {
          respuesta.reply = `Te encuentras en ${paisDetectado.toUpperCase()} 🌎. Te asignaremos la ruta de atención **OUT_COUNTRY_GLOBAL**, enfocada en:
- Capacidad de inversión
- Títulos universitarios (EB-2 NIW)
- Familiares ciudadanos en EE.UU.
- Solvencia económica

¿Deseas continuar con la pre-calificación? (Sí/No)`
        }
        break
      }

      case 'ROUTE_ASSIGN': {
        // Confirmar y comenzar preguntas de calificación
        const rutaSesion = ruta || 'OUT_COUNTRY_GLOBAL'
        const confirmacion = message.toLowerCase().trim()

        if (confirmacion.includes('no')) {
          respuesta.reply = 'Entendemos. Si en algún momento deseas iniciar tu pre-calificación, no dudes en contactarnos. ¡Que tengas un excelente día! 🙏'
          respuesta.nextStep = 'RESULT'
          respuesta.completed = true

          if (sesion) {
            await db.chatSession.update({
              where: { id: sesion.id },
              data: {
                currentStep: 'RESULT',
                qualificationResult: 'CANCELADO',
                completedAt: new Date(),
              },
            })
          }
          break
        }

        // Comenzar con la primera pregunta de calificación
        const primerPaso = rutaSesion === 'IN_COUNTRY_US' ? FLUJO_IN_COUNTRY_US[0] : FLUJO_OUT_COUNTRY_GLOBAL[0]
        const primeraPregunta = obtenerPreguntaActual(primerPaso, rutaSesion)

        if (primeraPregunta) {
          let textoPregunta = `¡Perfecto! Comencemos con la evaluación.\n\n**${primeraPregunta.pregunta}**`
          if (primeraPregunta.opciones) {
            textoPregunta += `\n\nOpciones: ${primeraPregunta.opciones.join(' | ')}`
          }

          respuesta.reply = textoPregunta
          respuesta.nextStep = primerPaso as PasoConversacion
          respuesta.route = rutaSesion

          if (sesion) {
            await db.chatSession.update({
              where: { id: sesion.id },
              data: { currentStep: primerPaso },
            })
          }
        }
        break
      }

      case 'Q_ASILO':
      case 'Q_VISA_TRABAJO':
      case 'Q_ESTATUS':
      case 'Q_RECORD_CRIMINAL':
      case 'Q_INVERSION':
      case 'Q_UNIVERSIDAD':
      case 'Q_FAMILIA_US':
      case 'Q_SOLVENCIA': {
        // Procesar respuesta de calificación
        const rutaSesion = ruta || 'OUT_COUNTRY_GLOBAL'
        const preguntaActual = obtenerPreguntaActual(paso, rutaSesion)

        if (preguntaActual) {
          // Guardar la respuesta del usuario
          respuestas[preguntaActual.campo] = message.trim()

          // Mapear respuestas de inversión a valores del modelo Lead
          if (preguntaActual.campo === 'investmentCapacity') {
            if (message.includes('Alta')) respuestas.investmentCapacity = 'HIGH'
            else if (message.includes('Media')) respuestas.investmentCapacity = 'MEDIUM'
            else respuestas.investmentCapacity = 'LOW'
          }

          // Mapear respuesta de récord criminal
          if (preguntaActual.campo === 'hasCriminalRecord') {
            respuestas.hasCriminalRecord = message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') ? 'true' : 'false'
          }

          // Mapear respuesta de título universitario
          if (preguntaActual.campo === 'hasUniversityDegree') {
            respuestas.hasUniversityDegree = message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') ? 'true' : 'false'
          }

          // Mapear respuesta de familiares en EE.UU.
          if (preguntaActual.campo === 'hasUsFamily') {
            respuestas.hasUsFamily = message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') ? 'true' : 'false'
          }

          // Mapear respuesta de solvencia
          if (preguntaActual.campo === 'solvencyVerified') {
            respuestas.solvencyVerified = message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') ? 'true' : 'false'
          }
        }

        // Obtener siguiente paso
        const siguientePaso = obtenerSiguientePaso(paso, rutaSesion)

        if (siguientePaso) {
          // Hay más preguntas
          const siguientePregunta = obtenerPreguntaActual(siguientePaso, rutaSesion)
          if (siguientePregunta) {
            let textoPregunta = `Gracias por tu respuesta.\n\n**${siguientePregunta.pregunta}**`
            if (siguientePregunta.opciones) {
              textoPregunta += `\n\nOpciones: ${siguientePregunta.opciones.join(' | ')}`
            }

            respuesta.reply = textoPregunta
            respuesta.nextStep = siguientePaso as PasoConversacion
            respuesta.route = rutaSesion
          }
        } else {
          // No hay más preguntas, calcular resultado
          const calificacion = calcularCalificacion(respuestas, rutaSesion)

          let emoji = '🟢'
          let mensajeResultado = ''

          if (calificacion.resultado === 'ALTA_PROBABILIDAD') {
            emoji = '🟢'
            mensajeResultado = '¡Felicidades! Tienes un perfil con alta probabilidad de calificación para un proceso migratorio exitoso.'
          } else if (calificacion.resultado === 'PROBABILIDAD_MEDIA') {
            emoji = '🟡'
            mensajeResultado = 'Tu perfil tiene probabilidad media. Un abogado especializado podría evaluar opciones adicionales para tu caso.'
          } else {
            emoji = '🔴'
            mensajeResultado = 'Tu perfil tiene una probabilidad más baja bajo las rutas estándar. Te recomendamos una consulta personalizada para explorar alternativas.'
          }

          respuesta.reply = `${emoji} **Resultado de Pre-Calificación**\n\n${mensajeResultado}\n\n- **Puntuación:** ${calificacion.score}/100\n- **Tipo de visa recomendado:** ${calificacion.visaType}\n- **Ruta:** ${rutaSesion}\n\nUn abogado especializado se pondrá en contacto contigo pronto. ¡Gracias por usar ImmiScale! 🙏`
          respuesta.nextStep = 'RESULT'
          respuesta.completed = true
          respuesta.route = rutaSesion
          respuesta.qualificationResult = calificacion

          // Actualizar sesión con resultado final
          if (sesion) {
            await db.chatSession.update({
              where: { id: sesion.id },
              data: {
                currentStep: 'RESULT',
                answersJson: JSON.stringify(respuestas),
                qualificationResult: calificacion.resultado,
                completedAt: new Date(),
              },
            })
          }

          // Crear lead automáticamente si la calificación es media o alta
          if (calificacion.score >= 35 && sesion) {
            try {
              const regionPorCodigo = await db.region.findFirst({
                where: { code: sesion.country || 'GLOBAL' },
              })

              if (regionPorCodigo) {
                await db.lead.create({
                  data: {
                    country: sesion.country || 'UNKNOWN',
                    regionId: regionPorCodigo.id,
                    route: rutaSesion,
                    visaType: calificacion.visaType,
                    hasCriminalRecord: respuestas.hasCriminalRecord === 'true',
                    investmentCapacity: respuestas.investmentCapacity || null,
                    hasUniversityDegree: respuestas.hasUniversityDegree === 'true',
                    hasUsFamily: respuestas.hasUsFamily === 'true',
                    solvencyVerified: respuestas.solvencyVerified === 'true',
                    qualificationScore: calificacion.score,
                    status: calificacion.score >= 60 ? 'QUALIFIED' : 'NEW',
                    chatSessionId: sesion.id,
                    source: 'CHATBOT',
                    notes: `Pre-calificación automática: ${calificacion.resultado}`,
                  },
                })
              }
            } catch (errorLead) {
              console.error('Error al crear lead desde chatbot:', errorLead)
              // No fallar la respuesta del chatbot por esto
            }
          }
        }

        // Actualizar respuestas en la sesión
        if (sesion) {
          await db.chatSession.update({
            where: { id: sesion.id },
            data: {
              answersJson: JSON.stringify(respuestas),
              currentStep: respuesta.nextStep,
            },
          })
        }
        break
      }

      case 'RESULT': {
        respuesta.reply = 'Tu evaluación ya ha sido completada. Si deseas iniciar una nueva pre-calificación, por favor recarga la página. ¡Gracias! 🙏'
        respuesta.nextStep = 'RESULT'
        respuesta.completed = true
        break
      }

      default: {
        respuesta.reply = 'Lo siento, no entendí tu respuesta. ¿Podrías intentarlo de nuevo?'
        respuesta.nextStep = paso
        break
      }
    }

    return NextResponse.json({
      exito: true,
      datos: respuesta,
    })
  } catch (error) {
    console.error('Error en chatbot:', error)
    return NextResponse.json(
      { exito: false, error: 'Error al procesar mensaje del chatbot' },
      { status: 500 }
    )
  }
}

// =============================================
// Función auxiliar: extraer país del mensaje
// =============================================
function extraerPaisDelMensaje(mensaje: string): string | null {
  if (!mensaje) return null

  const mensajeLimpio = mensaje.trim().toUpperCase()

  // Mapa de códigos de país y nombres comunes
  const mapaPaises: Record<string, string> = {
    'US': 'US',
    'USA': 'US',
    'ESTADOS UNIDOS': 'US',
    'UNITED STATES': 'US',
    'AMERICA': 'US',
    'EEUU': 'US',
    'PE': 'PE',
    'PERU': 'PE',
    'PERÚ': 'PE',
    'CO': 'CO',
    'COLOMBIA': 'CO',
    'MX': 'MX',
    'MEXICO': 'MX',
    'MÉXICO': 'MX',
    'AR': 'AR',
    'ARGENTINA': 'AR',
    'CL': 'CL',
    'CHILE': 'CL',
    'EC': 'EC',
    'ECUADOR': 'EC',
    'VE': 'VE',
    'VENEZUELA': 'VE',
    'BR': 'BR',
    'BRASIL': 'BR',
    'BRAZIL': 'BR',
    'ES': 'ES',
    'ESPAÑA': 'ES',
    'ESPAÑA': 'ES',
  }

  // Buscar coincidencia exacta primero
  if (mapaPaises[mensajeLimpio]) {
    return mapaPaises[mensajeLimpio]
  }

  // Buscar si el mensaje contiene algún nombre/código de país
  for (const [clave, codigo] of Object.entries(mapaPaises)) {
    if (mensajeLimpio.includes(clave)) {
      return codigo
    }
  }

  return null
}
