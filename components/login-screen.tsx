"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Users, Lock, Mail, Eye, EyeOff, Sparkles, Star } from "lucide-react"
import { LORICOIN_IMAGES } from "@/lib/loricoin-assets"
import Image from "next/image"

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300/30 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-300/30 rounded-full blur-xl" />
      <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white/20 rounded-full blur-lg" />
      
      {/* Floating coins decoration */}
      <div className="absolute top-20 right-20 animate-bounce">
        <Star className="w-8 h-8 text-yellow-300/60" />
      </div>
      <div className="absolute bottom-32 left-16 animate-bounce delay-300">
        <Star className="w-6 h-6 text-yellow-300/40" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-md" />
            <Image 
              src={LORICOIN_IMAGES.coin}
              alt="LoriCoin" 
              width={112} 
              height={112}
              className="w-full h-full object-contain relative z-10 drop-shadow-lg"
              unoptimized
            />
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">LoriCoin</h1>
          <p className="text-white/90 mt-2 text-lg">Aprende a manejar tu dinero jugando</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm backdrop-blur-sm">
              Educacion Financiera
            </span>
            <span className="px-3 py-1 bg-yellow-400/30 rounded-full text-white text-sm backdrop-blur-sm">
              Para Familias
            </span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-emerald-700 text-xl">Bienvenido a LoriCoin</CardTitle>
            <CardDescription>Selecciona tu tipo de cuenta para ingresar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="parent" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-emerald-100">
                <TabsTrigger value="parent" className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4" />
                  Padre/Madre
                </TabsTrigger>
                <TabsTrigger value="child" className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
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
                        className="pl-10 border-emerald-200 focus:border-emerald-500"
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
                        className="pl-10 pr-10 border-emerald-200 focus:border-emerald-500"
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

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Ingresar como Padre/Madre"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-emerald-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">o prueba el demo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleDemoLogin("parent")}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Entrar como Demo (Anabelia)
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
                        placeholder="Betito"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="pl-10 border-emerald-200 focus:border-emerald-500"
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
                        className="pl-10 text-center tracking-widest text-lg border-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Ingresar como Hijo/a"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-emerald-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">o prueba el demo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleDemoLogin("child")}
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Entrar como Demo (Betito)
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-white/90 text-sm">
            Desarrollado por <span className="font-bold">Betito Bascunan</span> gracias a Vercel
          </p>
          <p className="text-white/70 text-xs">
            Hackathon Zero to Agent 2026 | v0 + MCPs
          </p>
        </div>
      </div>
    </div>
  )
}
