'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRegions, sendChatMessage } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  MessageSquare,
  Send,
  Globe,
  MapPin,
  GitBranch,
  Settings2,
  ArrowRight,
  User,
  Bot,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

const FLOW_STEPS = [
  { id: 'GREETING', label: 'Saludo', icon: MessageSquare, desc: 'Bienvenida y presentación del bot' },
  { id: 'COUNTRY_DETECT', label: 'Detección País', icon: Globe, desc: 'Identificar país de origen del visitante' },
  { id: 'ROUTE_ASSIGN', label: 'Asignación Ruta', icon: GitBranch, desc: 'In-Country US u Out-Country Global' },
  { id: 'QUALIFICATION', label: 'Pre-Calificación', icon: Settings2, desc: 'Evaluar elegibilidad con preguntas clave' },
  { id: 'RESULT', label: 'Resultado', icon: MapPin, desc: 'Derivación al abogado o rechazo calificado' },
]

const ROUTES = [
  {
    id: 'IN_COUNTRY_US',
    label: 'In-Country US',
    flag: '🇺🇸',
    desc: 'Para visitantes ya en territorio estadounidense',
    steps: ['Asilo político', 'Ajuste de estatus', 'Cancelación de remoción', 'TPS renewal'],
    color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/20',
    badgeColor: 'text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-700',
  },
  {
    id: 'OUT_COUNTRY_GLOBAL',
    label: 'Out-Country Global',
    flag: '🌍',
    desc: 'Para visitantes fuera de EE.UU.',
    steps: ['EB-2 NIW', 'H-1B lottery', 'Reunificación familiar', 'Visa de inversor EB-5'],
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
    badgeColor: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  },
]

export function ChatbotTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente virtual de ImmiScale. Estoy aquí para ayudarte con tu proceso de inmigración. ¿En qué país te encuentras actualmente?',
    },
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isSending, setIsSending] = useState(false)

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  })

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMsg = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const result = await sendChatMessage(input, sessionId)
      setSessionId(result.sessionId || sessionId || crypto.randomUUID())
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }])
    } catch {
      toast.error('Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Constructor del Chatbot
        </h2>
        <p className="text-sm text-muted-foreground">Configura el flujo de conversación y previsualiza el chat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flow Diagram */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Flujo de Conversación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FLOW_STEPS.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{step.label}</span>
                          <Badge variant="outline" className="text-[10px]">{step.id}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </motion.div>
                    {idx < FLOW_STEPS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Route Selector */}
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold mb-3">Rutas de Derivación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROUTES.map((route) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-lg border-2 ${route.color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{route.flag}</span>
                    <h4 className="font-semibold text-sm">{route.label}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{route.desc}</p>
                  <div className="space-y-1.5">
                    {route.steps.map((step) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-xs">{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Preview */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Vista Previa del Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                        <User className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isSending && (
                <div className="flex gap-2 items-center">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="text-xs"
                  disabled={isSending}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={isSending || !input.trim()}
                  className="shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPL Targets Configuration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Objetivos CPL por Región
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {regions?.map((region) => (
              <div key={region.id} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{region.code}</span>
                  <Badge variant="outline" className="text-[10px]">{region.currency}</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPL Objetivo:</span>
                    <span className="font-medium text-emerald-600">${region.cplTarget.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kill Switch:</span>
                    <span className="font-medium text-red-600">${region.cplKillSwitch.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Idioma:</span>
                    <span>{region.language.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                Sin regiones configuradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
