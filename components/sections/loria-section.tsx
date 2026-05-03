"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, Lightbulb, PiggyBank, Target, HelpCircle, BookOpen, Loader2 } from "lucide-react"

const suggestedQuestions = [
  { icon: PiggyBank, text: "Como puedo ahorrar mas dinero?" },
  { icon: Target, text: "Que es un presupuesto?" },
  { icon: Lightbulb, text: "Por que es importante ahorrar?" },
  { icon: HelpCircle, text: "Que son los LoriCoins?" },
  { icon: BookOpen, text: "Enseñame sobre inversion" },
]

// Educational responses for when AI Gateway is not available
const educationalResponses: Record<string, string> = {
  "ahorro": `¡Excelente pregunta sobre el ahorro! 🐷

El ahorro es guardar una parte del dinero que recibes para usarlo mas tarde. Es como plantar una semilla que crece con el tiempo.

**Tips para empezar a ahorrar:**
1. Guarda al menos el 10% de tu mesada
2. Usa una alcancia o una cuenta de ahorro
3. Establece una meta clara (un juguete, un libro, etc.)

**Dato curioso:** Si ahorras $10 cada semana durante un año, tendras mas de $500!

¿Te gustaria aprender mas sobre como establecer metas de ahorro?`,

  "presupuesto": `¡Vamos a aprender sobre presupuestos! 📊

Un presupuesto es un plan para tu dinero. Te ayuda a saber:
- Cuanto dinero tienes
- Cuanto gastas
- Cuanto puedes ahorrar

**La Regla 50-30-20:**
- 50% para necesidades (comida, utiles escolares)
- 30% para gustos (juegos, dulces)
- 20% para ahorro

**Ejemplo:** Si recibes $100 de mesada:
- $50 para necesidades
- $30 para gustos
- $20 para tu alcancia

¿Quieres que te ayude a crear tu primer presupuesto?`,

  "inversion": `¡Hablemos de inversion! 📈

Invertir es poner tu dinero a trabajar para que crezca. Cuando inviertes, tu dinero puede generar mas dinero con el tiempo.

**El poder del interes compuesto:**
Imagina una bola de nieve bajando una montaña. Mientras mas rueda, mas grande se hace. Asi funciona el interes compuesto con tu dinero!

**Ejemplo simple:**
- Si tienes $100 y ganas 10% al año
- Año 1: $110
- Año 2: $121
- Año 3: $133

¡Tu dinero crece solo! ¿Te gustaria saber mas sobre como empezar?`,

  "loricoins": `¡Los LoriCoins son geniales! 🪙

Son la moneda de nuestra app que ganas por:
- Completar tareas: +50 LoriCoins
- Mantener el podio 5 dias: +20 LoriCoins  
- Hacer un deposito: +50 LoriCoins
- Completar lecciones conmigo: +30 LoriCoins
- Alcanzar tu meta de ahorro: +100 LoriCoins

**¿Para que sirven?**
- Subir en el podio de Guardianes del Tesoro
- Desbloquear logros especiales
- Competir con otros ninos de tu clase

¡Sigue aprendiendo y ahorrando para ganar mas LoriCoins!`,

  "default": `¡Hola! Soy LorIA, tu amiga de educacion financiera 🌟

Puedo enseñarte sobre:
- **Ahorro:** Como guardar dinero para el futuro
- **Presupuesto:** Como planificar tus gastos
- **Inversion:** Como hacer crecer tu dinero
- **LoriCoins:** Como ganar recompensas

¿Sobre cual tema te gustaria aprender hoy?`
}

function getEducationalResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes("ahorro") || lowerMessage.includes("ahorrar")) {
    return educationalResponses["ahorro"]
  }
  if (lowerMessage.includes("presupuesto")) {
    return educationalResponses["presupuesto"]
  }
  if (lowerMessage.includes("inversion") || lowerMessage.includes("invertir")) {
    return educationalResponses["inversion"]
  }
  if (lowerMessage.includes("loricoin") || lowerMessage.includes("lori coin")) {
    return educationalResponses["loricoins"]
  }
  
  return educationalResponses["default"]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function LoriaSection() {
  const { isChildMode, selectedChild, currentUser, addLoriCoins, triggerAction } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)

  const user = isChildMode && selectedChild ? selectedChild : currentUser

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Try AI first, fallback to local responses
    if (!useLocalFallback) {
      try {
        const response = await fetch("/api/loria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        })

        if (!response.ok) {
          throw new Error("API error")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No reader")

        let assistantContent = ""
        const assistantId = (Date.now() + 1).toString()

        // Add empty assistant message
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }])

        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.slice(5).trim()
              if (data === "[DONE]") continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.type === "text-delta" && parsed.delta) {
                  assistantContent += parsed.delta
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantId 
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  )
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Give LoriCoins for completing a lesson
        if (assistantContent.length > 100) {
          addLoriCoins(30, "Completaste una leccion con LorIA")
          triggerAction("complete_lesson")
        }

      } catch (error) {
        console.log("[v0] AI Gateway error, using local fallback:", error)
        setUseLocalFallback(true)
        
        // Use local fallback
        const localResponse = getEducationalResponse(message)
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: localResponse
        }])
        
        // Give LoriCoins for learning
        addLoriCoins(30, "Completaste una leccion con LorIA")
        triggerAction("complete_lesson")
      }
    } else {
      // Use local fallback directly
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate typing
      
      const localResponse = getEducationalResponse(message)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: localResponse
      }])
      
      // Give LoriCoins for learning
      addLoriCoins(30, "Completaste una leccion con LorIA")
      triggerAction("complete_lesson")
    }

    setIsLoading(false)
  }, [messages, isLoading, useLocalFallback, addLoriCoins, triggerAction])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">LorIA</h1>
            <p className="text-muted-foreground">Tu asistente de educacion financiera con IA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Hola, {user.name.split(" ")[0]}!</h3>
                  <p className="text-muted-foreground max-w-md">
                    Soy LorIA, tu amiga virtual potenciada por inteligencia artificial que te ayudara a aprender sobre dinero, ahorro e
                    inversiones. Preguntame lo que quieras!
                  </p>
                  <p className="text-xs text-primary mt-4 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Conectada a Notion para buscar lecciones educativas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar
                        className={`w-8 h-8 shrink-0 ${
                          msg.role === "assistant" ? "bg-primary" : "bg-secondary"
                        }`}
                      >
                        <AvatarFallback>
                          {msg.role === "assistant" ? (
                            <Sparkles className="w-4 h-4 text-primary-foreground" />
                          ) : (
                            <span className="text-sm">{user.avatar}</span>
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content || "..."}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 shrink-0 bg-primary">
                        <AvatarFallback>
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                          <span
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input - ALWAYS VISIBLE */}
            <div className="p-4 border-t bg-card shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu pregunta aqui..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Questions Sidebar */}
        <div className="hidden lg:flex lg:flex-col w-80 gap-4 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preguntas sugeridas</CardTitle>
              <CardDescription>Haz clic para preguntar a LorIA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((q, index) => {
                const Icon = q.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleSendMessage(q.text)}
                    disabled={isLoading}
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0 text-primary" />
                    <span className="text-sm">{q.text}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                Dato curioso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sabias que si ahorras $10 cada semana durante un año, tendras mas de $500? El
                ahorro pequeño pero constante hace grandes diferencias!
              </p>
            </CardContent>
          </Card>

          {/* LoriCoins Badge */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">+30 LoriCoins</p>
                  <p className="text-xs text-muted-foreground">por cada leccion completada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
