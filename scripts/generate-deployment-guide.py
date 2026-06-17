#!/usr/bin/env python3
"""
ImmiScale Meta Engine v5 - Guia Completa de Despliegue en Produccion
Genera un PDF profesional con todos los pasos para poner el sistema en marcha.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──────────────────────────────────────────────
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')

# ── Brand Colors (ImmiScale) ──────────────────────────────────────
EMERALD      = colors.HexColor('#059669')
EMERALD_DARK = colors.HexColor('#047857')
EMERALD_LIGHT = colors.HexColor('#D1FAE5')
META_BLUE    = colors.HexColor('#1877F2')
SLATE_900    = colors.HexColor('#0F172A')
SLATE_700    = colors.HexColor('#334155')
SLATE_500    = colors.HexColor('#64748B')
SLATE_200    = colors.HexColor('#E2E8F0')
SLATE_100    = colors.HexColor('#F1F5F9')
WHITE        = colors.HexColor('#FFFFFF')

# ── Page Setup ─────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_L = 2.2 * cm
MARGIN_R = 2.2 * cm
MARGIN_T = 2.5 * cm
MARGIN_B = 2.2 * cm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# ── Styles ─────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

sH1 = ParagraphStyle(
    'H1Custom', parent=styles['Heading1'],
    fontName='NotoSansSC-Bold', fontSize=22, leading=28,
    textColor=SLATE_900, spaceAfter=6, spaceBefore=18,
)
sH2 = ParagraphStyle(
    'H2Custom', parent=styles['Heading2'],
    fontName='NotoSansSC-Bold', fontSize=16, leading=22,
    textColor=EMERALD_DARK, spaceAfter=6, spaceBefore=14,
)
sH3 = ParagraphStyle(
    'H3Custom', parent=styles['Heading3'],
    fontName='NotoSansSC-Bold', fontSize=13, leading=18,
    textColor=SLATE_700, spaceAfter=4, spaceBefore=10,
)
sBody = ParagraphStyle(
    'BodyCustom', parent=styles['BodyText'],
    fontName='NotoSerifSC', fontSize=10.5, leading=17,
    textColor=SLATE_700, alignment=TA_JUSTIFY, spaceAfter=6,
)
sBullet = ParagraphStyle(
    'BulletCustom', parent=sBody,
    leftIndent=18, bulletIndent=6, spaceAfter=3,
    bulletFontName='NotoSansSC', bulletFontSize=10,
)
sCode = ParagraphStyle(
    'CodeCustom', parent=styles['Code'],
    fontName='Courier', fontSize=9, leading=13,
    textColor=colors.HexColor('#1E293B'),
    backColor=colors.HexColor('#F8FAFC'),
    borderWidth=0.5, borderColor=SLATE_200, borderPadding=6,
    spaceAfter=6, spaceBefore=4,
)
sNote = ParagraphStyle(
    'NoteStyle', parent=sBody,
    fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=colors.HexColor('#92400E'),
    backColor=colors.HexColor('#FFFBEB'),
    borderWidth=0.5, borderColor=colors.HexColor('#FDE68A'),
    borderPadding=8, leftIndent=8, rightIndent=8,
    spaceAfter=8, spaceBefore=4,
)
sStepBody = ParagraphStyle(
    'StepBody', parent=sBody,
    leftIndent=6, rightIndent=6, spaceAfter=2, spaceBefore=2,
)
sTOC = ParagraphStyle(
    'TOCEntry', parent=sBody,
    fontSize=11, leading=18, textColor=SLATE_700,
    leftIndent=12, spaceAfter=3,
)
sTOCH2 = ParagraphStyle(
    'TOCEntryH2', parent=sTOC,
    fontSize=10.5, leftIndent=28, textColor=SLATE_500,
)
sCheck = ParagraphStyle(
    'CheckItem', parent=sBullet,
    fontSize=10, leading=16,
)

# ── Helper Functions ───────────────────────────────────────────────
def p(text, style=sBody):
    return Paragraph(text, style)

def h1(text):
    return Paragraph(text, sH1)

def h2(text):
    return Paragraph(text, sH2)

def h3(text):
    return Paragraph(text, sH3)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def code(text):
    return Paragraph(text.replace('\n', '<br/>'), sCode)

def note(text):
    return Paragraph(f'<b>NOTA:</b> {text}', sNote)

def spacer(h=6):
    return Spacer(1, h)

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=SLATE_200, spaceAfter=8, spaceBefore=8)

def step_box(step_num, title, body_paragraphs):
    """Creates a styled step box with number badge and content."""
    elements = []
    badge_text = f'<font color="white"><b>PASO {step_num}</b></font>'
    title_text = f'  {title}'

    header_data = [[
        Paragraph(badge_text, ParagraphStyle('badge', fontName='NotoSansSC-Bold', fontSize=10, leading=14, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph(title_text, ParagraphStyle('stepT', fontName='NotoSansSC-Bold', fontSize=12, leading=16, textColor=WHITE)),
    ]]
    header_table = Table(header_data, colWidths=[60, CONTENT_W - 70])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), EMERALD),
        ('BACKGROUND', (1, 0), (1, 0), SLATE_900),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (0, 0), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (1, 0), (1, 0), 12),
    ]))
    elements.append(header_table)

    body_data = [[body_paragraphs]]
    body_table = Table(body_data, colWidths=[CONTENT_W - 10])
    body_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
        ('BOX', (0, 0), (-1, -1), 0.5, EMERALD_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(body_table)
    elements.append(spacer(8))
    return KeepTogether(elements)

def var_table(data_rows):
    """Creates a styled variable table: Variable | Valor | Descripcion"""
    header = [
        Paragraph('<b>Variable</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=9, textColor=WHITE, leading=12)),
        Paragraph('<b>Valor de Ejemplo</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=9, textColor=WHITE, leading=12)),
        Paragraph('<b>Descripcion</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=9, textColor=WHITE, leading=12)),
    ]
    rows = [header]
    for var_name, example, desc in data_rows:
        rows.append([
            Paragraph(f'<font face="Courier" size=8>{var_name}</font>', ParagraphStyle('td', fontSize=9, leading=12, textColor=SLATE_900)),
            Paragraph(f'<font face="Courier" size=8 color="#059669">{example}</font>', ParagraphStyle('td2', fontSize=9, leading=12)),
            Paragraph(desc, ParagraphStyle('td3', fontName='NotoSansSC', fontSize=9, leading=12, textColor=SLATE_700)),
        ])
    col_widths = [CONTENT_W * 0.30, CONTENT_W * 0.32, CONTENT_W * 0.38]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SLATE_900),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, SLATE_200),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


# ── Build Document ─────────────────────────────────────────────────
OUTPUT_PATH = '/home/z/my-project/download/ImmiScale_Guia_Despliegue_Produccion.pdf'
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=MARGIN_L, rightMargin=MARGIN_R,
    topMargin=MARGIN_T, bottomMargin=MARGIN_B,
    title='ImmiScale Meta Engine v5 - Guia de Despliegue en Produccion',
    author='Z.ai',
    subject='Guia paso a paso para configurar y desplegar ImmiScale en produccion real',
)

story = []

# ═══════════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════════
story.append(Spacer(1, 60))

# Brand badge
cover_badge_data = [[Paragraph('<b>IMMISCALE META ENGINE v5</b>', ParagraphStyle('cbadge', fontName='NotoSansSC-Bold', fontSize=10, textColor=WHITE, alignment=TA_CENTER))]]
cover_badge = Table(cover_badge_data, colWidths=[220])
cover_badge.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), EMERALD),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 16),
    ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(cover_badge)
story.append(Spacer(1, 30))

# Main title
story.append(Paragraph(
    'Guia Completa de<br/>Despliegue en Produccion',
    ParagraphStyle('coverTitle', fontName='NotoSansSC-Bold', fontSize=36, leading=44, textColor=SLATE_900)
))
story.append(Spacer(1, 16))

# Subtitle
story.append(Paragraph(
    'Sistema Multinacional de Adquisicion de Clientes para Abogados de Inmigracion',
    ParagraphStyle('coverSub', fontName='NotoSerifSC', fontSize=14, leading=20, textColor=SLATE_500)
))
story.append(Spacer(1, 24))

# Description
story.append(Paragraph(
    'Este documento detalla paso a paso como crear las cuentas necesarias, configurar las credenciales, '
    'desplegar la aplicacion en Vercel, conectar las APIs de Meta/Facebook, integrar las pasarelas de pago, '
    'y poner en funcionamiento completo el motor de adquisicion de leads para tu firma de inmigracion.',
    ParagraphStyle('coverDesc', fontName='NotoSerifSC', fontSize=11, leading=17, textColor=SLATE_700, alignment=TA_JUSTIFY)
))
story.append(Spacer(1, 40))

# Tech stack badges
tech_items = ['Next.js 16', 'Prisma', 'Meta API v21.0', 'PostgreSQL', 'Vercel', 'Stripe', 'MercadoPago']
badge_row = []
for tech in tech_items:
    badge_data = [[Paragraph(f'<font size=8><b>{tech}</b></font>', ParagraphStyle('tbadge', fontName='NotoSansSC-Bold', fontSize=8, textColor=EMERALD_DARK, alignment=TA_CENTER))]]
    badge_t = Table(badge_data, colWidths=[80])
    badge_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), EMERALD_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, EMERALD),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
    ]))
    badge_row.append(badge_t)

tech_table = Table([badge_row], colWidths=[85] * len(tech_items))
tech_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 2),
    ('RIGHTPADDING', (0, 0), (-1, -1), 2),
]))
story.append(tech_table)
story.append(Spacer(1, 60))

# Date and version
story.append(Paragraph(
    'Version 5.0  |  Junio 2026  |  Global Edition',
    ParagraphStyle('coverDate', fontName='NotoSansSC', fontSize=10, textColor=SLATE_500, alignment=TA_LEFT)
))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════════════════════
story.append(h1('Indice de Contenidos'))
story.append(hr())

toc_items = [
    ('1', 'Resumen de Arquitectura y Requisitos', False),
    ('2', 'Paso 1: Crear Cuenta en Meta for Developers', False),
    ('', '2.1  Crear la Aplicacion de Facebook', True),
    ('', '2.2  Configurar OAuth y Permisos', True),
    ('', '2.3  Obtener App ID y App Secret', True),
    ('3', 'Paso 2: Configurar Business Manager y Ad Account', False),
    ('', '3.1  Crear Business Manager', True),
    ('', '3.2  Crear Cuenta Publicitaria', True),
    ('', '3.3  Instalar Meta Pixel', True),
    ('4', 'Paso 3: Configurar Base de Datos PostgreSQL', False),
    ('', '4.1  Crear instancia en Supabase / Neon / Vercel Postgres', True),
    ('', '4.2  Migrar Schema de SQLite a PostgreSQL', True),
    ('5', 'Paso 4: Desplegar en Vercel', False),
    ('', '5.1  Conectar Repositorio GitHub', True),
    ('', '5.2  Configurar Variables de Entorno', True),
    ('', '5.3  Desplegar y Verificar', True),
    ('6', 'Paso 5: Conectar Meta API (OAuth Flow)', False),
    ('', '6.1  Ejecutar el Flujo OAuth', True),
    ('', '6.2  Verificar Conectividad', True),
    ('7', 'Paso 6: Configurar Webhooks de Meta', False),
    ('', '7.1  Registrar Webhook en Meta Developers', True),
    ('', '7.2  Eventos a Suscribir', True),
    ('8', 'Paso 7: Configurar Pasarelas de Pago', False),
    ('', '8.1  Stripe (Global)', True),
    ('', '8.2  MercadoPago (LatAm)', True),
    ('', '8.3  Niubiz (Peru) y Culqi', True),
    ('9', 'Paso 8: Configurar CAPI (Conversions API)', False),
    ('10', 'Paso 9: Verificacion End-to-End', False),
    ('11', 'Variables de Entorno - Referencia Completa', False),
    ('12', 'Checklist Final de Produccion', False),
]
for num, title, is_sub in toc_items:
    style = sTOCH2 if is_sub else sTOC
    prefix = f'<b>{num}</b>  ' if num else '     '
    story.append(p(f'{prefix}{title}', style))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# SECTION 1: Resumen de Arquitectura
# ═══════════════════════════════════════════════════════════════════
story.append(h1('1. Resumen de Arquitectura y Requisitos'))
story.append(hr())

story.append(p(
    'ImmiScale Meta Engine v5 es un sistema integral de adquisicion de clientes disenado especificamente para firmas de abogados de inmigracion. '
    'El sistema se conecta con la API de Meta/Facebook para gestionar campanas publicitarias, capturar leads pre-calificados, procesar pagos en multiples monedas y regiones, '
    'y automatizar el escalado de campanas basandose en un algoritmo propietario llamado Match Score. La arquitectura se compone de tres capas principales: '
    'el frontend web (Next.js 16 con dashboard responsivo), el backend API (rutas API de Next.js con Prisma ORM), y las integraciones externas (Meta Graph API, Stripe, MercadoPago, entre otras).'
))

story.append(p(
    'Para que el sistema funcione en produccion real, necesitas configurar cuentas en al menos 4 plataformas externas: Meta for Developers (para la API de Facebook Ads), '
    'un proveedor de base de datos PostgreSQL (como Supabase, Neon, o Vercel Postgres), Vercel (para el hosting del dashboard), y al menos una pasarela de pago '
    '(Stripe para pagos internacionales, o MercadoPago/Niubiz/Culqi para el mercado latinoamericano). Cada una de estas plataformas requiere sus propias credenciales, '
    'que se conectan al sistema a traves de variables de entorno configuradas en Vercel.'
))

story.append(h2('1.1  Requisitos Previos'))
story.append(bullet('Cuenta de Facebook personal activa (verificada con ID o tarjeta)'))
story.append(bullet('Pagina de Facebook para tu firma de abogados'))
story.append(bullet('Cuenta de GitHub con acceso al repositorio del proyecto'))
story.append(bullet('Dominio propio (opcional pero recomendado para produccion)'))
story.append(bullet('Tarjeta de credito para activar cuentas publicitarias de Meta y Stripe'))

story.append(h2('1.2  Arquitectura de Despliegue'))

arch_data = [
    ['Componente', 'Tecnologia', 'Hosting', 'Estado'],
    ['Dashboard Web', 'Next.js 16 + TypeScript', 'Vercel', 'Listo'],
    ['Base de Datos', 'Prisma ORM + PostgreSQL', 'Supabase / Neon', 'Requiere migracion'],
    ['API de Meta', 'Graph API v21.0', 'Meta Servers', 'Requiere credenciales'],
    ['OAuth 2.0', 'Facebook Login', 'Meta + Vercel', 'Requiere configuracion'],
    ['CAPI (Conversions)', 'Server-Side Events', 'Vercel Serverless', 'Requiere Pixel ID'],
    ['Webhooks', 'Real-Time Updates', 'Meta -> Vercel', 'Requiere URL publica'],
    ['Pagos Global', 'Stripe', 'Stripe Servers', 'Requiere cuenta'],
    ['Pagos LatAm', 'MercadoPago / Niubiz / Culqi', 'Proveedores', 'Opcional'],
]
arch_table = Table(arch_data, colWidths=[CONTENT_W * 0.22, CONTENT_W * 0.28, CONTENT_W * 0.22, CONTENT_W * 0.28])
arch_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SLATE_900),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTNAME', (0, 1), (-1, -1), 'NotoSansSC'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F8FAFC')]),
    ('GRID', (0, 0), (-1, -1), 0.5, SLATE_200),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(arch_table)
story.append(spacer(12))

# ═══════════════════════════════════════════════════════════════════
# SECTION 2: Meta for Developers
# ═══════════════════════════════════════════════════════════════════
story.append(h1('2. Paso 1: Crear Cuenta en Meta for Developers'))
story.append(hr())

story.append(p(
    'Meta for Developers es la plataforma de Facebook que te permite crear aplicaciones que interactuan con la API de Facebook, Instagram y WhatsApp. '
    'Para ImmiScale, necesitas una aplicacion de tipo "Negocio" (Business) que tenga acceso a la Marketing API, la Conversions API y los permisos de gestion de anuncios. '
    'Este es el paso mas critico de toda la configuracion, ya que sin estas credenciales el sistema no puede comunicarse con Meta para crear campanas, obtener leads o enviar eventos de conversion.'
))

story.append(h2('2.1  Crear la Aplicacion de Facebook'))
story.append(step_box(1, 'Ir a Meta for Developers', [
    p('Navega a <b>https://developers.facebook.com/</b> e inicia sesion con tu cuenta de Facebook personal. Si no tienes una cuenta de developer, haz clic en "Comenzar" y completa el registro aceptando los terminos de servicio. Facebook te pedira que verifiques tu cuenta mediante un numero de telefono o tarjeta de credito.', sStepBody),
    p('Una vez dentro del dashboard de developers, haz clic en <b>"Mis Aplicaciones"</b> y luego en <b>"Crear Aplicacion"</b>. Selecciona el tipo de aplicacion <b>"Negocio"</b> (Business), que es el que proporciona acceso a la Marketing API, Conversions API y permisos avanzados de publicidad.', sStepBody),
]))

story.append(step_box(2, 'Completar los datos de la aplicacion', [
    p('Rellena el formulario con la siguiente informacion. El nombre de la aplicacion debe ser reconocible y profesional, ya que aparecera en los permisos que solicites a los usuarios. La categoria debe ser "Negocios" o "Publicidad" para que Meta te otorgue los permisos correctos automaticamente.', sStepBody),
    bullet('<b>Nombre de la app:</b> ImmiScale Lead Engine (o el nombre de tu firma)'),
    bullet('<b>Email de contacto:</b> Tu email profesional'),
    bullet('<b>Categoria del negocio:</b> Servicios profesionales / Legal'),
    bullet('<b>Politica de privacidad URL:</b> URL de la politica de privacidad de tu sitio web'),
]))

story.append(step_box(3, 'Agregar productos a la aplicacion', [
    p('Dentro de la configuracion de tu aplicacion recien creada, ve a la seccion <b>"Agregar productos"</b> y anade los siguientes productos. Cada producto habilita un conjunto de permisos y endpoints de la API que ImmiScale necesita para funcionar correctamente. Sin estos productos agregados, los permisos no estaran disponibles para tu aplicacion.', sStepBody),
    bullet('<b>Facebook Login:</b> Permite el flujo OAuth 2.0 para obtener tokens de acceso'),
    bullet('<b>Marketing API:</b> Permite crear y gestionar campanas, conjuntos de anuncios y anuncios'),
    bullet('<b>Conversions API:</b> Permite enviar eventos de conversion desde el servidor (CAPI)'),
    bullet('<b>Webhooks:</b> Permite recibir notificaciones en tiempo real de leads y cambios de estado'),
]))

story.append(h2('2.2  Configurar OAuth y Permisos'))

story.append(p(
    'La configuracion de OAuth es fundamental para que ImmiScale pueda solicitar permisos al usuario (tu) y obtener un token de acceso de larga duracion. '
    'Sin esta configuracion, el flujo de autenticacion fallara con un error de redirect_uri_mismatch. Necesitas configurar la URL de redireccionamiento OAuth en la seccion '
    '"Facebook Login > Configuracion" de tu aplicacion en Meta Developers.'
))

story.append(step_box(4, 'Configurar URLs de redireccionamiento OAuth', [
    p('En la seccion <b>Facebook Login > Configuracion</b>, agrega las siguientes URLs en el campo "URI de redireccionamiento de OAuth validos". '
      'La URL debe coincidir exactamente con el dominio donde despliegues la aplicacion en Vercel. Si despliegas en multiples entornos (staging + produccion), agrega ambas URLs.', sStepBody),
    code('https://tu-dominio.vercel.app/api/meta/auth'),
    code('http://localhost:3000/api/meta/auth  (solo para desarrollo local)'),
    note('Reemplaza "tu-dominio" con el subdominio real que Vercel asigne a tu proyecto. Puedes configurar esto despues del despliegue, pero es obligatorio antes de usar el OAuth flow en produccion.'),
]))

story.append(step_box(5, 'Solicitar permisos avanzados', [
    p('Por defecto, Meta otorga permisos basicos en modo desarrollo. Para produccion, necesitas pasar por el proceso de <b>Revision de Aplicaciones</b> (App Review) para obtener los siguientes permisos avanzados. '
      'Sin estos permisos, la API solo funciona con usuarios que tienen rol de desarrollador/tester en la app.', sStepBody),
    bullet('<b>ads_management:</b> Crear, pausar y modificar campanas publicitarias'),
    bullet('<b>ads_read:</b> Leer metricas, insights y datos de campanas'),
    bullet('<b>business_management:</b> Gestionar Business Manager y cuentas vinculadas'),
    bullet('<b>pages_read_engagement:</b> Leer interacciones de la pagina de Facebook'),
    bullet('<b>pages_manage_ads:</b> Crear anuncios en nombre de la pagina'),
    note('Para la fase inicial, puedes usar la app en modo desarrollo con tu propia cuenta. Solo necesitas App Review cuando quieras que otros abogados usen la plataforma con sus propias cuentas de Facebook.'),
]))

story.append(h2('2.3  Obtener App ID y App Secret'))

story.append(p(
    'Estas son las dos credenciales principales que identifican tu aplicacion ante la API de Meta. El App ID es publico y se usa en el frontend para inicializar el SDK de Facebook. '
    'El App Secret es confidencial y solo debe usarse en el servidor (backend) para intercambiar codigos de autorizacion por tokens de acceso. Nunca expongas el App Secret en el codigo del cliente o en repositorios publicos.'
))

story.append(step_box(6, 'Copiar credenciales', [
    p('En el dashboard de tu aplicacion en Meta Developers, encontraras el <b>App ID</b> y el <b>App Secret</b> en la seccion <b>"Configuracion > Basica"</b>. '
      'El App ID es visible directamente. Para ver el App Secret, haz clic en "Mostrar" junto al campo; Facebook te pedira tu contrasena de Facebook por seguridad. '
      'Copia ambos valores y guardalos en un lugar seguro, ya que los necesitaras para configurar las variables de entorno en Vercel.', sStepBody),
    p('<b>Tambien necesitas crear un token de verificacion para webhooks:</b> En la seccion Webhooks de tu aplicacion, necesitaras un <b>Verify Token</b> personalizado. '
      'Este es un string arbitrario que tu eliges (por ejemplo, "immiscale_verify_2026_prod") y que debes configurar tanto en Meta Developers como en la variable de entorno META_WEBHOOK_VERIFY_TOKEN.', sStepBody),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 3: Business Manager
# ═══════════════════════════════════════════════════════════════════
story.append(h1('3. Paso 2: Configurar Business Manager y Ad Account'))
story.append(hr())

story.append(p(
    'Meta Business Manager es la plataforma centralizada donde gestionas tus paginas de Facebook, cuentas publicitarias, pixeles y otros activos de negocio. '
    'ImmiScale necesita una cuenta publicitaria activa dentro de un Business Manager para poder crear campanas, gestionar presupuestos y obtener metricas. '
    'El Business Manager tambien es donde vinculas tu aplicacion de desarrollador con los activos de tu negocio (pagina, cuenta publicitaria, pixel).'
))

story.append(h2('3.1  Crear Business Manager'))
story.append(step_box(1, 'Ir a Business Manager', [
    p('Navega a <b>https://business.facebook.com/</b> y haz clic en "Crear cuenta". Ingresa el nombre de tu firma de abogados, tu nombre y tu email profesional de trabajo. '
      'Facebook te pedira que verifiques el negocio subiendo documentos legales (como el registro de la empresa). Este proceso puede tardar entre 1-5 dias habiles, '
      'pero puedes comenzar a usar la cuenta en modo limitado inmediatamente.', sStepBody),
    note('La verificacion del negocio es obligatoria para usar la Marketing API en modo produccion (App Review). Sin verificacion, solo puedes operar en modo desarrollo.'),
]))

story.append(step_box(2, 'Vincular tu Pagina de Facebook', [
    p('Dentro de Business Manager, ve a <b>"Configuracion del negocio > Paginas"</b> y haz clic en "Agregar". Selecciona la pagina de Facebook de tu firma de abogados. '
      'Si aun no tienes una pagina, creala antes desde Facebook. La pagina es necesaria porque las campanas publicitarias se ejecutan en nombre de una pagina, no de una persona.', sStepBody),
]))

story.append(h2('3.2  Crear Cuenta Publicitaria'))
story.append(step_box(3, 'Crear la cuenta de anuncios', [
    p('En Business Manager, ve a <b>"Configuracion del negocio > Cuentas publicitarias"</b> y haz clic en "Agregar". Crea una nueva cuenta publicitaria. '
      'Facebook te pedira una tarjeta de credito para activar la cuenta y poder gastar en anuncios. Anota el <b>ID de la cuenta publicitaria</b> que Facebook te asigna '
      '(formato: act_123456789). Este ID es crucial ya que es el valor que debes poner en la variable de entorno META_AD_ACCOUNT_ID.', sStepBody),
    note('El ID de la cuenta publicitaria siempre comienza con "act_" seguido de numeros. Por ejemplo: act_123456789012. Este valor es diferente al ID del Business Manager.'),
]))

story.append(h2('3.3  Instalar Meta Pixel'))
story.append(step_box(4, 'Crear e instalar el Meta Pixel', [
    p('El Meta Pixel es un fragmento de codigo que rastrea las acciones de los usuarios en tu sitio web y las envia a Facebook para la optimizacion de anuncios y la medicion de conversiones. '
      'En Business Manager, ve a <b>"Eventos > Pixeles"</b> y haz clic en "Crear pixel". Asignale un nombre descriptivo como "ImmiScale Lead Pixel" y selecciona la opcion de instalacion manual.', sStepBody),
    p('El sistema ImmiScale utiliza el Pixel de dos formas: (1) como referencia para enviar eventos server-side a traves de la Conversions API (CAPI), y (2) como vinculacion entre las acciones del usuario en el sitio y las campanas de Meta. '
      'Anota el <b>ID del Pixel</b> (un numero de 10-15 digitos), ya que es el valor para la variable de entorno META_PIXEL_ID.', sStepBody),
    note('El Pixel ID se muestra en la configuracion del pixel en Events Manager. Es un numero como 123456789012345. No necesitas instalar el codigo del pixel manualmente; ImmiScale lo maneja a traves de la CAPI.'),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 4: Base de Datos PostgreSQL
# ═══════════════════════════════════════════════════════════════════
story.append(h1('4. Paso 3: Configurar Base de Datos PostgreSQL'))
story.append(hr())

story.append(p(
    'ImmiScale utiliza Prisma ORM como capa de acceso a datos, y durante el desarrollo se uso SQLite por simplicidad. Sin embargo, Vercel ejecuta funciones serverless sin sistema de archivos persistente, '
    'lo que hace imposible usar SQLite en produccion. Necesitas migrar a PostgreSQL, que es el motor de base de datos relacional mas compatible con Prisma y Vercel. '
    'Existen varias opciones de hosting para PostgreSQL, y la eleccion depende de tu presupuesto y preferencia de gestion.'
))

story.append(h2('4.1  Crear instancia en Supabase / Neon / Vercel Postgres'))

providers_data = [
    ['Proveedor', 'Plan Gratuito', 'Conexion', 'Recomendacion'],
    ['Supabase', '500 MB, 2 proyectos', 'PostgreSQL estandar', 'Mejor para empezar'],
    ['Neon', '512 MB, 1 proyecto', 'PostgreSQL serverless', 'Mas rapido cold start'],
    ['Vercel Postgres', '256 MB (Hobby)', 'Integracion nativa', 'Mas facil con Vercel'],
    ['Railway', '$5 credito/mes', 'PostgreSQL estandar', 'Buen scaling'],
]
providers_table = Table(providers_data, colWidths=[CONTENT_W * 0.20, CONTENT_W * 0.22, CONTENT_W * 0.25, CONTENT_W * 0.33])
providers_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SLATE_900),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTNAME', (0, 1), (-1, -1), 'NotoSansSC'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F8FAFC')]),
    ('GRID', (0, 0), (-1, -1), 0.5, SLATE_200),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(providers_table)
story.append(spacer(8))

story.append(step_box(1, 'Crear cuenta y proyecto en Supabase (recomendado)', [
    p('Ve a <b>https://supabase.com/</b> y crea una cuenta gratuita. Crea un nuevo proyecto eligiendo una region cercana a tu mercado objetivo (us-east-1 para EEUU, sa-east-1 para Brasil/LatAm). '
      'Elige una contrasena segura para la base de datos. Una vez creado el proyecto, ve a <b>Settings > Database</b> y copia la <b>Connection String</b> (URI). '
      'Esta cadena tiene el formato: <font face="Courier" size=8>postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres</font>', sStepBody),
    note('Usa la conexion "Pooler" (puerto 6543) para Vercel serverless, no la conexion directa (puerto 5432). El pooler maneja multiples conexiones concurrentes de funciones serverless.'),
]))

story.append(h2('4.2  Migrar Schema de SQLite a PostgreSQL'))

story.append(step_box(2, 'Modificar el schema de Prisma', [
    p('Abre el archivo <font face="Courier" size=8>prisma/schema.prisma</font> en tu proyecto y realiza los siguientes cambios para cambiar el proveedor de base de datos de SQLite a PostgreSQL:', sStepBody),
    code('datasource db {<br/>  provider = "postgresql"<br/>  url      = env("DATABASE_URL")<br/>  directUrl = env("DIRECT_URL")<br/>}'),
    p('El campo <b>directUrl</b> es necesario para Supabase porque Prisma necesita una conexion directa para las migraciones, mientras que la URL principal usa el pooler para las consultas en runtime. '
      'Sin directUrl, las migraciones fallaran con un error de conexion. Ademas, necesitas cambiar los tipos de datos que son incompatibles entre SQLite y PostgreSQL: '
      'los campos <font face="Courier" size=8>String @id @default(uuid())</font> funcionan igual, pero los campos <font face="Courier" size=8>DateTime @default(now())</font> '
      'y las relaciones se comportan igual en ambos motores.', sStepBody),
]))

story.append(step_box(3, 'Ejecutar la migracion', [
    p('Una vez modificado el schema y configurada la URL de PostgreSQL en tu archivo .env local, ejecuta los siguientes comandos en la raiz del proyecto para crear la migracion y aplicarla a la base de datos remota:', sStepBody),
    code('npx prisma migrate dev --name init_postgresql<br/>npx prisma generate'),
    p('El primer comando crea un archivo de migracion SQL y lo aplica a la base de datos remota. El segundo comando regenera el cliente de Prisma con los tipos actualizados. '
      'Verifica que las tablas se hayan creado correctamente en el dashboard de Supabase, en la seccion <b>Table Editor</b>. Deberias ver 8 tablas: Region, Campaign, AdSet, Lead, Payment, Metric, ChatSession, y MetaCredential.', sStepBody),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 5: Desplegar en Vercel
# ═══════════════════════════════════════════════════════════════════
story.append(h1('5. Paso 4: Desplegar en Vercel'))
story.append(hr())

story.append(p(
    'Vercel es la plataforma de hosting optimizada para aplicaciones Next.js. Ofrece despliegue automatico desde GitHub, funciones serverless para las rutas API, '
    'certificados SSL automaticos y un CDN global. El plan gratuito (Hobby) es suficiente para comenzar, con limites de 100 GB de ancho de banda y 100 horas de ejecucion serverless por mes. '
    'Para un volumen mayor de leads y webhooks, considera el plan Pro ($20/mes) que aumenta estos limites significativamente.'
))

story.append(h2('5.1  Conectar Repositorio GitHub'))
story.append(step_box(1, 'Importar proyecto en Vercel', [
    p('Ve a <b>https://vercel.com/</b> e inicia sesion con tu cuenta de GitHub. Haz clic en <b>"Add New > Project"</b> y selecciona el repositorio <b>facebook-ads</b> de tu cuenta. '
      'Si el repositorio es privado, Vercel te pedira permisos para acceder. Vercel detectara automaticamente que es un proyecto Next.js y configurara el framework, el comando de build y el directorio de salida correctamente.', sStepBody),
]))

story.append(h2('5.2  Configurar Variables de Entorno'))

story.append(p(
    'Esta es la parte mas importante del despliegue. Las variables de entorno contienen todas las credenciales y configuraciones que la aplicacion necesita para conectarse con servicios externos. '
    'En Vercel, ve a <b>Settings > Environment Variables</b> de tu proyecto y agrega cada variable. Asegurate de seleccionar los entornos correctos (Production, Preview, Development) para cada una.'
))

story.append(p('<b>Variables ESENCIALES (obligatorias para que el sistema funcione):</b>', sH3))

story.append(var_table([
    ('DATABASE_URL', 'postgresql://postgres.xxx:pass@...pooler.supabase.com:6543/postgres', 'Conexion PostgreSQL (pooler)'),
    ('DIRECT_URL', 'postgresql://postgres.xxx:pass@db.xxx.supabase.co:5432/postgres', 'Conexion directa para migraciones Prisma'),
    ('META_APP_ID', '1234567890123456', 'App ID de tu aplicacion en Meta Developers'),
    ('META_APP_SECRET', 'a1b2c3d4e5f6g7h8i9j0', 'App Secret de tu aplicacion en Meta Developers'),
    ('META_AD_ACCOUNT_ID', 'act_123456789012', 'ID de tu cuenta publicitaria en Business Manager'),
    ('META_PIXEL_ID', '123456789012345', 'ID del Meta Pixel en Events Manager'),
    ('META_WEBHOOK_VERIFY_TOKEN', 'immiscale_verify_2026_prod', 'Token que tu eliges para verificar webhooks'),
    ('NEXT_PUBLIC_APP_URL', 'https://tu-app.vercel.app', 'URL publica de tu aplicacion desplegada'),
    ('NODE_ENV', 'production', 'Entorno de ejecucion'),
]))
story.append(spacer(8))

story.append(p('<b>Variables de PAGO (configura las que necesites):</b>', sH3))

story.append(var_table([
    ('STRIPE_SECRET_KEY', 'sk_live_xxxxxxxx', 'Clave secreta de Stripe (modo produccion)'),
    ('STRIPE_PUBLISHABLE_KEY', 'pk_live_xxxxxxxx', 'Clave publica de Stripe (frontend)'),
    ('STRIPE_WEBHOOK_SECRET', 'whsec_xxxxxxxx', 'Secreto del webhook de Stripe'),
    ('MERCADOPAGO_ACCESS_TOKEN', 'APP_USR-xxxx-xxxx', 'Token de acceso de MercadoPago'),
    ('NIUBIZ_MERCHANT_ID', '1234567', 'ID de comerciante Niubiz (Peru)'),
    ('NIUBIZ_ACCESS_KEY', 'xxxxxxxxxxxxxxxx', 'Clave de acceso Niubiz'),
    ('CULQI_PUBLIC_KEY', 'pk_live_xxxxxxxx', 'Clave publica Culqi'),
    ('CULQI_SECRET_KEY', 'sk_live_xxxxxxxx', 'Clave secreta Culqi'),
]))
story.append(spacer(8))

story.append(note(
    'NUNCA pongas estas variables en el codigo fuente o en commits de Git. Siempre usa el panel de Vercel para configurarlas. '
    'Si accidentalmente haces commit de un secret, rotalo inmediatamente en la plataforma correspondiente y actualiza el valor en Vercel.'
))

story.append(h2('5.3  Desplegar y Verificar'))
story.append(step_box(2, 'Ejecutar el primer despliegue', [
    p('Despues de configurar todas las variables de entorno, haz clic en <b>"Deploy"</b> en Vercel. El proceso de build tardara entre 2-5 minutos. '
      'Vercel ejecutara automaticamente los comandos definidos en vercel.json: <font face="Courier" size=8>prisma generate && next build</font>. '
      'Si el build falla, revisa los logs en el dashboard de Vercel para identificar el error. Los errores mas comunes son: variables de entorno faltantes, problemas de conexion a la base de datos, o dependencias faltantes.', sStepBody),
]))

story.append(step_box(3, 'Verificar el despliegue', [
    p('Una vez que el despliegue sea exitoso, Vercel te asignara una URL publica como <b>https://facebook-ads-xxx.vercel.app</b>. Abre esta URL en tu navegador y verifica:', sStepBody),
    bullet('El dashboard carga correctamente con las 6 pestanas (Resumen, Campanas, Leads, Pagos, Chatbot, Ajustes)'),
    bullet('La pestana "Ajustes" muestra la seccion de conexion Meta (debe estar desconectada inicialmente)'),
    bullet('El endpoint de salud responde correctamente: <font face="Courier" size=8>https://tu-app.vercel.app/api/health</font>'),
    bullet('El endpoint de base de datos funciona: <font face="Courier" size=8>https://tu-app.vercel.app/api/init-db</font>'),
    note('Si la base de datos no se inicializo automaticamente, haz un POST a /api/seed para cargar datos de demostracion. Esto te permitira ver el dashboard con datos antes de conectar Meta.'),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 6: Conectar Meta API
# ═══════════════════════════════════════════════════════════════════
story.append(h1('6. Paso 5: Conectar Meta API (OAuth Flow)'))
story.append(hr())

story.append(p(
    'Con el dashboard desplegado y funcionando, el siguiente paso es conectar tu cuenta de Facebook/Meta con ImmiScale a traves del flujo OAuth 2.0. '
    'Este flujo es la forma segura de otorgar permisos a la aplicacion sin compartir tu contrasena de Facebook. El resultado es un token de acceso de larga duracion '
    '(60 dias) que ImmiScale almacena en la base de datos y usa automaticamente para todas las llamadas a la API de Meta.'
))

story.append(h2('6.1  Ejecutar el Flujo OAuth'))
story.append(step_box(1, 'Iniciar la conexion desde el Dashboard', [
    p('Abre tu dashboard en <b>https://tu-app.vercel.app</b>, ve a la pestana <b>"Ajustes"</b>, y busca la seccion <b>"Meta Connection"</b>. '
      'Haz clic en el boton <b>"Conectar con Facebook"</b>. Esto te redirigira a la pagina de login de Facebook, donde se te pedira que autorices a ImmiScale para acceder a tus campanas, '
      'cuenta publicitaria y datos de leads. Los permisos que se solicitan son: ads_management, ads_read, business_management, pages_read_engagement y pages_manage_ads.', sStepBody),
    note('Si la app esta en modo desarrollo, solo los usuarios con rol de desarrollador, tester o administrador en la aplicacion de Meta pueden completar el flujo OAuth. Otros usuarios recibiran un error de permisos.'),
]))

story.append(step_box(2, 'Autorizar y obtener el token', [
    p('Despues de aceptar los permisos en Facebook, seras redirigido de vuelta al dashboard. El backend de ImmiScale recibe un codigo de autorizacion que intercambia automaticamente por un token de acceso de corta duracion, '
      'y luego por un token de larga duracion (60 dias). Este token se almacena en la tabla <b>MetaCredential</b> de la base de datos, junto con la fecha de expiracion y los permisos otorgados. '
      'El dashboard deberia mostrar ahora el estado "Conectado" con informacion de tu cuenta publicitaria.', sStepBody),
    p('Si prefieres no usar OAuth, tambien puedes ingresar manualmente un token de acceso en la seccion de Ajustes usando la opcion <b>"Ingresar Token Manualmente"</b>. '
      'Para obtener un token manual, ve a <b>Meta Developers > Tu App > Marketing API > Tools</b> y genera un token de acceso del sistema. Ten en cuenta que los tokens manuales no se refrescan automaticamente.', sStepBody),
]))

story.append(h2('6.2  Verificar Conectividad'))
story.append(step_box(3, 'Probar la conexion', [
    p('Una vez conectado, verifica que la API funciona correctamente visitando los siguientes endpoints en tu navegador o usando cURL:', sStepBody),
    code('GET /api/meta/status<br/>  - Debe mostrar: connected: true, accountId, pixelId'),
    code('GET /api/meta/sync<br/>  - Debe mostrar: connectionStatus: "connected"'),
    code('POST /api/meta/sync  { "type": "campaigns" }<br/>  - Debe sincronizar campanas existentes de Meta a tu DB'),
    p('Si alguno de estos endpoints devuelve un error, revisa los logs de Vercel (Functions > Logs) para ver el detalle del error. Los problemas mas comunes son: token expirado, permisos insuficientes, o ID de cuenta publicitaria incorrecto.', sStepBody),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 7: Webhooks
# ═══════════════════════════════════════════════════════════════════
story.append(h1('7. Paso 6: Configurar Webhooks de Meta'))
story.append(hr())

story.append(p(
    'Los webhooks de Meta permiten que ImmiScale reciba notificaciones en tiempo real cuando ocurren eventos importantes en tus campanas, como la creacion de un nuevo lead, '
    'cambios en el estado de una campana, o modificaciones en el presupuesto de un conjunto de anuncios. Sin webhooks, tendrias que sondear la API periodicamente (polling) para detectar cambios, '
    'lo cual es ineficiente y puede tener retrasos de hasta 15 minutos. Con webhooks, los eventos llegan en segundos.'
))

story.append(h2('7.1  Registrar Webhook en Meta Developers'))
story.append(step_box(1, 'Suscribir al webhook en tu aplicacion', [
    p('En el dashboard de Meta Developers, ve a tu aplicacion y luego a <b>Webhooks</b>. Haz clic en <b>"Agregar suscripcion"</b> y selecciona <b>"Cuenta publicitaria"</b> (Ad Account). '
      'Configura los siguientes campos:', sStepBody),
    bullet('<b>URL de callback:</b> <font face="Courier" size=8>https://tu-app.vercel.app/api/meta/webhook</font>'),
    bullet('<b>Verificar token:</b> El mismo valor que configuraste en META_WEBHOOK_VERIFY_TOKEN (ej: immiscale_verify_2026_prod)'),
    p('Al hacer clic en "Verificar y guardar", Meta enviara una peticion GET a tu URL de callback con un desafio (hub.challenge). Tu endpoint de webhook debe responder con el valor del desafio para confirmar que la URL es valida. '
      'ImmiScale ya implementa esta logica automaticamente en <font face="Courier" size=8>src/app/api/meta/webhook/route.ts</font>. Si la verificacion falla, revisa que la URL sea correcta y que el verify token coincida exactamente.', sStepBody),
]))

story.append(h2('7.2  Eventos a Suscribir'))
story.append(step_box(2, 'Seleccionar los eventos del webhook', [
    p('Despues de verificar el webhook, selecciona los siguientes eventos para suscribirte. Estos son los eventos que ImmiScale sabe procesar automaticamente:', sStepBody),
    bullet('<b>leadgen:</b> Se dispara cuando un usuario completa un formulario de lead en Facebook/Instagram. ImmiScale crea automaticamente un registro de Lead en la base de datos con los datos del formulario.'),
    bullet('<b>adset_status:</b> Se dispara cuando un conjunto de anuncios cambia de estado (activo, pausado, archivado). Permite al dashboard reflejar cambios en tiempo real.'),
    bullet('<b>campaign_status:</b> Se dispara cuando una campana cambia de estado. Permite al sistema de automatizacion detectar campanas pausadas y reactivarlas si corresponde.'),
    bullet('<b>adset_budget:</b> Se dispara cuando se modifica el presupuesto de un conjunto de anuncios. ImmiScale puede ajustar automaticamente el presupuesto basandose en el Match Score.'),
    note('Meta tambien ofrece eventos como "ad_creative_create" e "image_create", pero ImmiScale no los procesa actualmente. Suscribirte a eventos innecesarios solo genera trafico adicional.'),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 8: Pasarelas de Pago
# ═══════════════════════════════════════════════════════════════════
story.append(h1('8. Paso 7: Configurar Pasarelas de Pago'))
story.append(hr())

story.append(p(
    'ImmiScale soporta multiples pasarelas de pago para adaptarse a los diferentes mercados donde operan los abogados de inmigracion. Stripe es la pasarela principal para pagos internacionales '
    '(tarjetas de credito/debito en USD, EUR, GBP), mientras que MercadoPago, Niubiz y Culqi cubren el mercado latinoamericano con metodos de pago locales como OXXO, PIX, PSE, y Yape. '
    'Configura las pasarelas que correspondan a tus mercados objetivo. No es necesario configurar todas; solo las que vayas a utilizar.'
))

story.append(h2('8.1  Stripe (Global)'))
story.append(step_box(1, 'Crear cuenta de Stripe', [
    p('Ve a <b>https://stripe.com/</b> y crea una cuenta. Completa el proceso de verificacion del negocio subiendo tus documentos legales. Stripe aprueba la mayoria de cuentas de servicios legales en 1-2 dias habiles. '
      'Una vez aprobada, ve al dashboard de Stripe y obtiene las siguientes credenciales:', sStepBody),
    bullet('<b>Secret Key (sk_live_...):</b> En Developers > API keys > Secret key. Se usa en el backend para crear cargos y gestionar suscripciones.'),
    bullet('<b>Publishable Key (pk_live_...):</b> En Developers > API keys > Publishable key. Se usa en el frontend para inicializar Stripe.js y recopilar datos de tarjeta de forma segura.'),
    bullet('<b>Webhook Secret (whsec_...):</b> En Developers > Webhooks. Crea un endpoint de webhook apuntando a <font face="Courier" size=8>https://tu-app.vercel.app/api/payments/webhook</font> y copia el secreto de firma.'),
    note('Primero prueba con las claves de prueba (sk_test_... y pk_test_...) para verificar que la integracion funciona antes de cambiar a las claves de produccion.'),
]))

story.append(h2('8.2  MercadoPago (LatAm)'))
story.append(step_box(2, 'Crear cuenta de MercadoPago', [
    p('Ve a <b>https://www.mercadopago.com/</b> y crea una cuenta de vendedor. Completa el proceso de verificacion con tus documentos. '
      'Luego ve a <b>Tu negocio > Configuracion > Credenciales</b> y copia el <b>Access Token de produccion</b> (formato: APP_USR-xxxx-xxxx). '
      'Este token permite crear preferencias de pago, recibir notificaciones de pago y consultar el estado de las transacciones. MercadoPago soporta pagos en Argentina, Brasil, Chile, Colombia, Mexico, Peru y Uruguay.', sStepBody),
]))

story.append(h2('8.3  Niubiz (Peru) y Culqi'))
story.append(step_box(3, 'Configurar pasarelas locales', [
    p('<b>Niubiz</b> es la pasarela de pago del Banco de la Nacion (Peru) que soporta pagos con tarjetas Visa y Mastercard, asi como Yape y Plin. Para configurarla, contacta a Niubiz directamente en <b>https://www.niubiz.com.pe/</b> para obtener tu Merchant ID y Access Key. '
      'El proceso de alta es mas largo que Stripe (2-4 semanas) pero es necesario si operas en Peru.', sStepBody),
    p('<b>Culqi</b> es una pasarela peruana alternativa que soporta tarjetas, Yape, PLIN y transferencias bancarias. Ve a <b>https://culqi.com/</b> para crear una cuenta y obtener las claves publica y secreta. '
      'Culqi tiene un proceso de alta mas rapido que Niubiz (3-5 dias) y es una buena opcion para empezar en el mercado peruano.', sStepBody),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 9: CAPI
# ═══════════════════════════════════════════════════════════════════
story.append(h1('9. Paso 8: Configurar CAPI (Conversions API)'))
story.append(hr())

story.append(p(
    'La Conversions API (CAPI) de Meta permite enviar eventos de conversion directamente desde tu servidor a Facebook, en lugar de depender unicamente del pixel del navegador. '
    'Esto es crucial porque los navegadores modernos bloquean cada vez mas las cookies de terceros y los trackers, lo que significa que el pixel del navegador pierde entre un 20-30% de los eventos. '
    'Con CAPI, ImmiScale envia eventos como "Lead" (nuevo lead), "Purchase" (pago completado) y "CompleteRegistration" (registro finalizado) desde el servidor, garantizando una medicion mas precisa '
    'y permitiendo que Meta optimize mejor las campanas publicitarias.'
))

story.append(step_box(1, 'Verificar configuracion del Pixel ID', [
    p('La CAPI requiere que tengas un Pixel ID valido configurado en la variable de entorno META_PIXEL_ID. Si ya creaste el pixel en el Paso 2 (seccion 3.3), simplemente verifica que el valor en Vercel coincida con el ID que aparece en Events Manager de Meta. '
      'ImmiScale envia eventos CAPI a traves del endpoint <font face="Courier" size=8>POST /{pixel_id}/events</font> de la Graph API, usando el token de acceso almacenado en la base de datos.', sStepBody),
]))

story.append(step_box(2, 'Verificar el envio de eventos CAPI', [
    p('Para probar que la CAPI funciona, crea un lead de prueba usando el formulario de contacto del dashboard o el chatbot. Luego, verifica en <b>Events Manager de Meta</b> que el evento "Lead" aparezca en la seccion de <b>Conversions API</b> del pixel. '
      'Tambien puedes verificar manualmente enviando un evento de prueba:', sStepBody),
    code('POST /api/capi<br/>Content-Type: application/json<br/><br/>{<br/>  "event_name": "Lead",<br/>  "event_source_url": "https://tu-app.vercel.app",<br/>  "user_data": {<br/>    "email": "test@example.com",<br/>    "phone": "51999999999"<br/>  }<br/>}'),
    note('ImmiScale hashea automaticamente los datos del usuario con SHA-256 antes de enviarlos a Meta, como requiere la politica de privacidad de la CAPI. Nunca se envian datos personales en texto plano.'),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 10: Verificacion End-to-End
# ═══════════════════════════════════════════════════════════════════
story.append(h1('10. Paso 9: Verificacion End-to-End'))
story.append(hr())

story.append(p(
    'Despues de completar todos los pasos anteriores, es fundamental realizar una verificacion completa de extremo a extremo para asegurarte de que todos los componentes del sistema estan conectados y funcionando correctamente. '
    'Esta verificacion simula el flujo completo de un usuario, desde que ve un anuncio en Facebook hasta que completa un pago, pasando por la captura del lead y la medicion de la conversion.'
))

story.append(h2('10.1  Checklist de Verificacion'))

checklist_data = [
    ['#', 'Componente', 'Verificacion', 'Resultado Esperado'],
    ['1', 'Dashboard Web', 'Abrir https://tu-app.vercel.app', 'Dashboard carga con 6 tabs'],
    ['2', 'Base de Datos', 'GET /api/health', '{"status":"ok","db":"connected"}'],
    ['3', 'Meta OAuth', 'Clic "Conectar con Facebook"', 'Token guardado, "Conectado"'],
    ['4', 'Meta API', 'GET /api/meta/status', 'connected: true, accountId'],
    ['5', 'Sync Campanas', 'POST /api/meta/sync {type:"campaigns"}', 'Campanas sincronizadas a DB'],
    ['6', 'Sync Metricas', 'POST /api/meta/sync {type:"insights"}', 'Metricas visibles en dashboard'],
    ['7', 'Webhook', 'Verificar en Meta Developers', 'Suscripcion activa con eventos'],
    ['8', 'Lead Capture', 'Crear lead de prueba', 'Lead aparece en tab "Leads"'],
    ['9', 'CAPI', 'Verificar en Events Manager', 'Evento "Lead" recibido via CAPI'],
    ['10', 'Pago', 'Procesar pago de prueba', 'Pago aparece en tab "Pagos"'],
]
checklist_table = Table(checklist_data, colWidths=[CONTENT_W * 0.05, CONTENT_W * 0.18, CONTENT_W * 0.40, CONTENT_W * 0.37])
checklist_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SLATE_900),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 8),
    ('FONTNAME', (0, 1), (-1, -1), 'NotoSansSC'),
    ('FONTSIZE', (0, 1), (-1, -1), 8.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F8FAFC')]),
    ('GRID', (0, 0), (-1, -1), 0.5, SLATE_200),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
]))
story.append(checklist_table)
story.append(spacer(12))

story.append(h2('10.2  Solucion de Problemas Comunes'))

problems_data = [
    ['Problema', 'Causa Probable', 'Solucion'],
    ['OAuth redirige a error', 'URL de callback mal configurada', 'Verificar URL en Facebook Login > Settings coincida con /api/meta/auth'],
    ['Token expirado (401)', 'Token de acceso expiro (60 dias)', 'Reconectar con Facebook desde Ajustes. El sistema alerta automaticamente.'],
    ['Webhook no recibe eventos', 'URL o verify token incorrectos', 'Verificar URL y token en Meta Developers > Webhooks'],
    ['Base de datos no conecta', 'DATABASE_URL incorrecta o IP bloqueada', 'Verificar cadena de conexion y pooler habilitado en Supabase'],
    ['CAPI no envia eventos', 'META_PIXEL_ID faltante o incorrecto', 'Verificar Pixel ID en Vercel env vars y Events Manager'],
    ['Campanas no sincronizan', 'META_AD_ACCOUNT_ID incorrecto', 'Verificar que el ID comience con "act_" y sea la cuenta correcta'],
    ['Pagos fallan', 'Claves test/live mezcladas', 'Asegurar consistencia (todas test o todas live)'],
]
problems_table = Table(problems_data, colWidths=[CONTENT_W * 0.22, CONTENT_W * 0.33, CONTENT_W * 0.45])
problems_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C2D12')),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTNAME', (0, 1), (-1, -1), 'NotoSansSC'),
    ('FONTSIZE', (0, 1), (-1, -1), 8.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#FEF2F2')]),
    ('GRID', (0, 0), (-1, -1), 0.5, SLATE_200),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
]))
story.append(problems_table)
story.append(spacer(12))

# ═══════════════════════════════════════════════════════════════════
# SECTION 11: Referencia Completa de Variables
# ═══════════════════════════════════════════════════════════════════
story.append(h1('11. Variables de Entorno - Referencia Completa'))
story.append(hr())

story.append(p(
    'A continuacion se presenta la referencia completa de todas las variables de entorno que ImmiScale necesita, organizadas por categoria. '
    'Las marcadas como "Obligatorio" son necesarias para que el sistema funcione. Las marcadas como "Opcional" habilitan funcionalidades adicionales que no son estrictamente necesarias para el funcionamiento basico del dashboard.'
))

story.append(h2('11.1  Base de Datos'))
story.append(var_table([
    ('DATABASE_URL', 'postgresql://user:pass@host:6543/db', 'OBLIGATORIO. Cadena de conexion PostgreSQL con pooler'),
    ('DIRECT_URL', 'postgresql://user:pass@host:5432/db', 'OBLIGATORIO con Supabase. Conexion directa para migraciones'),
]))

story.append(h2('11.2  Meta / Facebook API'))
story.append(var_table([
    ('META_APP_ID', '1234567890123456', 'OBLIGATORIO. App ID de la aplicacion en Meta Developers'),
    ('META_APP_SECRET', 'a1b2c3d4e5f6g7h8i9j0', 'OBLIGATORIO. App Secret para intercambio de tokens'),
    ('META_ACCESS_TOKEN', 'EAABsbCS1iHgBAK...', 'OPCIONAL. Token de acceso inicial (se obtiene via OAuth)'),
    ('META_AD_ACCOUNT_ID', 'act_123456789012', 'OBLIGATORIO. ID de la cuenta publicitaria'),
    ('META_PIXEL_ID', '123456789012345', 'OBLIGATORIO para CAPI. ID del Meta Pixel'),
    ('META_BUSINESS_ID', '123456789012345', 'OPCIONAL. ID del Business Manager'),
    ('META_WEBHOOK_VERIFY_TOKEN', 'immiscale_verify_2026', 'OBLIGATORIO para webhooks. Token personalizado'),
    ('META_GRAPH_API_VERSION', 'v21.0', 'OPCIONAL. Version de la Graph API (default: v21.0)'),
]))

story.append(h2('11.3  Pagos Internacionales (Stripe)'))
story.append(var_table([
    ('STRIPE_SECRET_KEY', 'sk_live_xxxxxxxx', 'OPCIONAL. Clave secreta de Stripe'),
    ('STRIPE_PUBLISHABLE_KEY', 'pk_live_xxxxxxxx', 'OPCIONAL. Clave publica de Stripe'),
    ('STRIPE_WEBHOOK_SECRET', 'whsec_xxxxxxxx', 'OPCIONAL. Secreto del webhook de Stripe'),
]))

story.append(h2('11.4  Pagos Latinoamerica'))
story.append(var_table([
    ('MERCADOPAGO_ACCESS_TOKEN', 'APP_USR-xxxx-xxxx', 'OPCIONAL. Token de MercadoPago'),
    ('NIUBIZ_MERCHANT_ID', '1234567', 'OPCIONAL. ID de comerciante Niubiz (Peru)'),
    ('NIUBIZ_ACCESS_KEY', 'xxxxxxxxxxxxxxxx', 'OPCIONAL. Clave de acceso Niubiz'),
    ('CULQI_PUBLIC_KEY', 'pk_live_xxxxxxxx', 'OPCIONAL. Clave publica Culqi'),
    ('CULQI_SECRET_KEY', 'sk_live_xxxxxxxx', 'OPCIONAL. Clave secreta Culqi'),
]))

story.append(h2('11.5  Configuracion de la Aplicacion'))
story.append(var_table([
    ('NEXT_PUBLIC_APP_URL', 'https://tu-app.vercel.app', 'OBLIGATORIO. URL publica de la app (para OAuth redirects)'),
    ('NODE_ENV', 'production', 'OBLIGATORIO. Entorno de ejecucion (production/development)'),
]))

# ═══════════════════════════════════════════════════════════════════
# SECTION 12: Checklist Final
# ═══════════════════════════════════════════════════════════════════
story.append(h1('12. Checklist Final de Produccion'))
story.append(hr())

story.append(p(
    'Antes de declarar tu instancia de ImmiScale como "en produccion", asegurate de completar cada uno de los siguientes items. '
    'Este checklist resume todos los pasos anteriores en un formato rapido de verificar. Marca cada item conforme lo completes para tener la certeza de que no falta nada por configurar.'
))

final_checklist = [
    ('Cuentas Creadas', [
        'Cuenta de Meta for Developers creada y verificada',
        'Aplicacion de tipo Negocio creada en Meta Developers',
        'Facebook Login, Marketing API, CAPI y Webhooks agregados como productos',
        'Business Manager creado y verificado (o en proceso de verificacion)',
        'Cuenta publicitaria creada y activada con tarjeta de credito',
        'Meta Pixel creado en Events Manager',
        'Cuenta de Supabase/Neon creada con proyecto PostgreSQL',
        'Cuenta de Vercel creada y conectada a GitHub',
        'Cuenta de Stripe creada y verificada (si aplica)',
        'Cuenta de MercadoPago creada (si aplica)',
    ]),
    ('Variables de Entorno en Vercel', [
        'DATABASE_URL configurada con cadena PostgreSQL pooler',
        'DIRECT_URL configurada con cadena PostgreSQL directa',
        'META_APP_ID configurada con el App ID de Meta',
        'META_APP_SECRET configurada con el App Secret de Meta',
        'META_AD_ACCOUNT_ID configurada con el ID de la cuenta publicitaria (act_...)',
        'META_PIXEL_ID configurada con el ID del Pixel',
        'META_WEBHOOK_VERIFY_TOKEN configurada con tu token personalizado',
        'NEXT_PUBLIC_APP_URL configurada con la URL de Vercel',
        'NODE_ENV configurada como "production"',
        'STRIPE_SECRET_KEY y STRIPE_PUBLISHABLE_KEY (si usa Stripe)',
    ]),
    ('Configuracion en Meta Developers', [
        'URL de redireccionamiento OAuth configurada: https://tu-app.vercel.app/api/meta/auth',
        'Permisos del app: ads_management, ads_read, business_management, pages_read_engagement',
        'Webhook suscrito con URL: https://tu-app.vercel.app/api/meta/webhook',
        'Eventos del webhook suscritos: leadgen, adset_status, campaign_status, adset_budget',
        'Verify Token del webhook coincide con META_WEBHOOK_VERIFY_TOKEN',
    ]),
    ('Schema y Base de Datos', [
        'prisma/schema.prisma cambiado a provider = "postgresql"',
        'directUrl agregado al datasource en schema.prisma',
        'Migracion ejecutada: npx prisma migrate dev --name init_postgresql',
        'Tablas verificadas en el dashboard de Supabase/Neon',
        'Datos seed cargados: POST /api/seed',
    ]),
    ('Verificacion Post-Despliegue', [
        'Dashboard carga correctamente en la URL de Vercel',
        'GET /api/health devuelve status ok',
        'OAuth flow completado: Meta conectado en Ajustes',
        'GET /api/meta/status muestra connected: true',
        'Campanas sincronizadas: POST /api/meta/sync {type:"campaigns"}',
        'Metricas sincronizadas: POST /api/meta/sync {type:"insights"}',
        'CAPI enviando eventos (verificar en Events Manager)',
        'Webhooks recibiendo eventos (verificar en Meta Developers)',
    ]),
]

for category, items in final_checklist:
    story.append(h2(category))
    for item in items:
        story.append(Paragraph(f'<bullet>&square;</bullet> {item}', sCheck))
    story.append(spacer(8))

# ── Build PDF ──────────────────────────────────────────────────────
doc.build(story)
print(f'PDF generado exitosamente: {OUTPUT_PATH}')
