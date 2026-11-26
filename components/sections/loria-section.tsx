"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, Lightbulb, PiggyBank, Target, HelpCircle, BookOpen, Loader2 } from "lucide-react"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import { getKnowledgeResponse } from "@/lib/loria-knowledge"
import { initials } from "@/lib/loricoin/client-utils"
import Image from "next/image"

const suggestedQuestions = [
  { icon: PiggyBank, text: "Como puedo ahorrar mas dinero?" },
  { icon: Target, text: "Como creo una meta financiera?" },
  { icon: Lightbulb, text: "Diferencia entre necesidad y deseo" },
  { icon: HelpCircle, text: "Que son los LoriCoins?" },
  { icon: BookOpen, text: "Ideas de emprendimiento para ninos" },
]

// Usar la base de conocimiento completa
function getEducationalResponse(message: string): string {
  return getKnowledgeResponse(message)
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function LoriaSection() {
  const { profile } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)

  const user = { name: profile?.name ?? "", avatar: initials(profile?.name) }

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

        if (!assistantContent.trim()) {
          setMessages(prev => prev.filter(m => m.id !== assistantId))
          throw new Error("Empty AI response")
        }

      } catch {
        setUseLocalFallback(true)
        
        // Use local fallback
        const localResponse = getEducationalResponse(message)
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: localResponse
        }])
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
    }

    setIsLoading(false)
  }, [messages, isLoading, useLocalFallback])

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
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 p-1">
            <Image 
              src={LORICOIN_IMAGES.learning}
              alt="LorIA" 
              width={56} 
              height={56}
              className="w-full h-full object-cover rounded-full"
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              LorIA
              <span className="text-xs bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-2 py-0.5 rounded-full">AI</span>
            </h1>
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
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                    <Image 
                      src={LORICOIN_IMAGES.learning}
                      alt="LorIA" 
                      width={96} 
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
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
        </div>
      </div>
    </div>
  )
}
