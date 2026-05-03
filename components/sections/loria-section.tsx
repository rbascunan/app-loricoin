"use client"

import { useRef, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, Lightbulb, PiggyBank, Target, HelpCircle, BookOpen } from "lucide-react"

const suggestedQuestions = [
  { icon: PiggyBank, text: "Como puedo ahorrar mas dinero?" },
  { icon: Target, text: "Que es un presupuesto?" },
  { icon: Lightbulb, text: "Por que es importante ahorrar?" },
  { icon: HelpCircle, text: "Que son los LoriCoins?" },
  { icon: BookOpen, text: "Enseñame sobre inversion" },
]

function getUIMessageText(parts: Array<{ type: string; text?: string }>): string {
  if (!parts || !Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

export function LoriaSection() {
  const { isChildMode, selectedChild, currentUser } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)

  const user = isChildMode && selectedChild ? selectedChild : currentUser

  const { messages, sendMessage, status, input, setInput } = useChat({
    transport: new DefaultChatTransport({ api: '/api/loria' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return
    setInput('')
    await sendMessage({ text: message })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
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

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
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
                  {messages.map((msg) => {
                    const content = getUIMessageText(msg.parts as Array<{ type: string; text?: string }>)
                    if (!content) return null
                    
                    return (
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
                          <p className="text-sm whitespace-pre-wrap">{content}</p>
                        </div>
                      </div>
                    )
                  })}
                  {isStreaming && messages[messages.length - 1]?.role === 'user' && (
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

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu pregunta..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isStreaming}
                />
                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isStreaming}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Questions Sidebar */}
        <div className="hidden lg:block w-80">
          <Card>
            <CardHeader>
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
                    disabled={isStreaming}
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0 text-primary" />
                    <span className="text-sm">{q.text}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="mt-4">
            <CardHeader>
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

          {/* MCP Badge */}
          <Card className="mt-4 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">Notion MCP</p>
                  <p className="text-xs text-muted-foreground">Conectado para lecciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
