"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, User, Users, Lock, Mail, Eye, EyeOff, Sparkles } from "lucide-react"

export function LoginScreen() {
  const { login } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Parent form state
  const [parentEmail, setParentEmail] = useState("")
  const [parentPassword, setParentPassword] = useState("")

  // Child form state
  const [childName, setChildName] = useState("")
  const [childPin, setChildPin] = useState("")

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(parentEmail, parentPassword, "parent")
      if (!success) {
        setError("Credenciales incorrectas")
      }
    } catch {
      setError("Error al iniciar sesion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(childName, childPin, "child")
      if (!success) {
        setError("PIN incorrecto")
      }
    } catch {
      setError("Error al iniciar sesion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: "parent" | "child") => {
    setIsLoading(true)
    await login("demo@example.com", "demo", role)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Coins className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">LoriCoin</h1>
          <p className="text-muted-foreground mt-2">Educacion financiera para toda la familia</p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>Selecciona tu tipo de cuenta para ingresar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="parent" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="parent" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Padre/Madre
                </TabsTrigger>
                <TabsTrigger value="child" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Hijo/a
                </TabsTrigger>
              </TabsList>

              {/* Parent Login */}
              <TabsContent value="parent">
                <form onSubmit={handleParentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent-email">Correo electronico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="parent-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-password">Contrasena</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="parent-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu contrasena"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Ingresar como Padre/Madre"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">o prueba el demo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDemoLogin("parent")}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Entrar como Demo (Padre)
                  </Button>
                </form>
              </TabsContent>

              {/* Child Login */}
              <TabsContent value="child">
                <form onSubmit={handleChildLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="child-name">Tu nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="child-name"
                        type="text"
                        placeholder="Lucas"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child-pin">PIN secreto (4 digitos)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="child-pin"
                        type="password"
                        placeholder="****"
                        maxLength={4}
                        value={childPin}
                        onChange={(e) => setChildPin(e.target.value.replace(/\D/g, ""))}
                        className="pl-10 text-center tracking-widest text-lg"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Ingresar como Hijo/a"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">o prueba el demo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDemoLogin("child")}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Entrar como Demo (Lucas)
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          LoriCoin - Hackathon Zero to One 2026
          <br />
          v0 + Supabase + Notion MCP
        </p>
      </div>
    </div>
  )
}
