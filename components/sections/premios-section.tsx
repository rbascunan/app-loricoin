"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gift, Sparkles, Check, Star } from "lucide-react"
import Image from "next/image"

interface Premio {
  id: string
  name: string
  description: string
  loriCoins: number
  image: string
  category: string
  featured?: boolean
}

const premios: Premio[] = [
  {
    id: "p1",
    name: "Bicicleta Mountain Bike",
    description: "Bicicleta rodado 24 perfecta para aventuras",
    loriCoins: 5000,
    image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop&bg=white",
    category: "Deportes",
    featured: true,
  },
  {
    id: "p2",
    name: "2 Entradas Mundial 2026",
    description: "Entradas para ver un partido del Mundial de futbol",
    loriCoins: 15000,
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=300&fit=crop&bg=white",
    category: "Experiencias",
    featured: true,
  },
  {
    id: "p3",
    name: "Viaje Familiar Bariloche",
    description: "Viaje de 5 dias para toda la familia a Bariloche",
    loriCoins: 25000,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&bg=white",
    category: "Viajes",
    featured: true,
  },
  {
    id: "p4",
    name: "Viaje Mar del Plata",
    description: "Viaje de 4 dias en familia a Mar del Plata",
    loriCoins: 18000,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&bg=white",
    category: "Viajes",
  },
  {
    id: "p5",
    name: "Ahorro para Moto 110cc",
    description: "Comienza a ahorrar para tu primera moto economica",
    loriCoins: 30000,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&bg=white",
    category: "Vehiculos",
  },
  {
    id: "p6",
    name: "Bicicleta Electrica",
    description: "Bicicleta electrica plegable para ir al colegio",
    loriCoins: 12000,
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop&bg=white",
    category: "Vehiculos",
  },
  {
    id: "p7",
    name: "Drone con Camara HD",
    description: "Drone para principiantes con camara incluida",
    loriCoins: 8000,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop&bg=white",
    category: "Tecnologia",
  },
  {
    id: "p8",
    name: "Kit Utiles Escolares Premium",
    description: "Mochila + utiles completos para todo el ano",
    loriCoins: 2000,
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop&bg=white",
    category: "Escolar",
  },
  {
    id: "p9",
    name: "Cumple en el Cole",
    description: "Torta, bebidas y sorpresitas para festejar con tus companeros",
    loriCoins: 3500,
    image: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop&bg=white",
    category: "Experiencias",
  },
  {
    id: "p10",
    name: "Album + Figuritas Mundial",
    description: "Album oficial y 100 sobres de figuritas del Mundial 2026",
    loriCoins: 1500,
    image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=300&fit=crop&bg=white",
    category: "Coleccionables",
  },
  {
    id: "p11",
    name: "Entrada Recital K-Pop",
    description: "Entrada para ver a tu grupo favorito de K-Pop",
    loriCoins: 6000,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&bg=white",
    category: "Experiencias",
  },
  {
    id: "p12",
    name: "Entrada Evento Marvel",
    description: "Entrada al evento especial de Marvel con actividades",
    loriCoins: 4500,
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=300&fit=crop&bg=white",
    category: "Experiencias",
  },
  {
    id: "p13",
    name: "Set de Arte Profesional",
    description: "Caja completa con lapices, acuarelas y pinceles",
    loriCoins: 1800,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop&bg=white",
    category: "Arte",
  },
  {
    id: "p14",
    name: "Telescopio Principiante",
    description: "Telescopio para explorar las estrellas y planetas",
    loriCoins: 4000,
    image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=400&h=300&fit=crop&bg=white",
    category: "Ciencia",
  },
  {
    id: "p15",
    name: "Kit Robotica Educativa",
    description: "Kit para armar y programar tu propio robot",
    loriCoins: 3500,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop&bg=white",
    category: "Ciencia",
  },
  {
    id: "p16",
    name: "Patineta Profesional",
    description: "Skateboard completo con diseno personalizado",
    loriCoins: 2500,
    image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=400&h=300&fit=crop&bg=white",
    category: "Deportes",
  },
  {
    id: "p17",
    name: "Clase de Surf (5 clases)",
    description: "Pack de 5 clases de surf con instructor",
    loriCoins: 5500,
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&h=300&fit=crop&bg=white",
    category: "Deportes",
  },
  {
    id: "p18",
    name: "Instrumento Musical",
    description: "Guitarra acustica o teclado a eleccion",
    loriCoins: 4500,
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop&bg=white",
    category: "Musica",
  },
  {
    id: "p19",
    name: "Set de Libros Aventura",
    description: "Coleccion de 10 libros de aventuras y fantasia",
    loriCoins: 1200,
    image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&h=300&fit=crop&bg=white",
    category: "Lectura",
  },
  {
    id: "p20",
    name: "Dia en Parque de Diversiones",
    description: "Entrada + comida para toda la familia",
    loriCoins: 7000,
    image: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400&h=300&fit=crop&bg=white",
    category: "Experiencias",
  },
]

const categories = ["Todos", "Experiencias", "Deportes", "Viajes", "Tecnologia", "Ciencia", "Escolar", "Arte"]

export function PremiosSection() {
  const { currentUser, selectedChild, isChildMode } = useApp()
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedPremio, setSelectedPremio] = useState<Premio | null>(null)
  const [canjeDialogOpen, setCanjeDialogOpen] = useState(false)
  const [canjeSuccess, setCanjeSuccess] = useState(false)

  const user = isChildMode && selectedChild ? selectedChild : currentUser
  const userLoriCoins = user.loriCoins

  const filteredPremios = selectedCategory === "Todos" 
    ? premios 
    : premios.filter(p => p.category === selectedCategory)

  const featuredPremios = premios.filter(p => p.featured)

  const handleCanjear = (premio: Premio) => {
    setSelectedPremio(premio)
    setCanjeDialogOpen(true)
  }

  const confirmCanje = () => {
    // Here you would deduct LoriCoins and process the reward
    setCanjeSuccess(true)
    setTimeout(() => {
      setCanjeDialogOpen(false)
      setCanjeSuccess(false)
      setSelectedPremio(null)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tienda de Premios</h1>
            <p className="text-muted-foreground">Canjea tus LoriCoins por increibles premios</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
          <Image 
            src="/images/loricoin-mascot.png" 
            alt="LoriCoin" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
          <div>
            <p className="text-xs opacity-80">Tu saldo</p>
            <p className="text-xl font-bold">{userLoriCoins.toLocaleString()} LC</p>
          </div>
        </div>
      </div>

      {/* Featured Premios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-semibold">Premios Destacados</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPremios.map((premio) => (
            <Card key={premio.id} className="overflow-hidden group hover:shadow-xl transition-all border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={premio.image}
                  alt={premio.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                  <Star className="w-3 h-3 mr-1 fill-white" /> Destacado
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{premio.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{premio.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                    {premio.loriCoins.toLocaleString()} LC
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleCanjear(premio)}
                    disabled={userLoriCoins < premio.loriCoins}
                    className={userLoriCoins >= premio.loriCoins 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                      : ""}
                  >
                    {userLoriCoins >= premio.loriCoins ? "Canjear" : "Faltan LC"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat 
              ? "bg-emerald-600 hover:bg-emerald-700 shrink-0" 
              : "shrink-0"}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* All Premios Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPremios.map((premio) => (
          <Card key={premio.id} className="overflow-hidden group hover:shadow-lg transition-all">
            <div className="relative h-32 overflow-hidden bg-gray-100">
              <Image
                src={premio.image}
                alt={premio.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                {premio.category}
              </Badge>
            </div>
            <CardContent className="p-3 space-y-2">
              <h3 className="font-semibold text-sm line-clamp-1">{premio.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{premio.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-emerald-600">
                  {premio.loriCoins.toLocaleString()} LC
                </span>
                <Button 
                  size="sm"
                  variant={userLoriCoins >= premio.loriCoins ? "default" : "outline"}
                  onClick={() => handleCanjear(premio)}
                  disabled={userLoriCoins < premio.loriCoins}
                  className={userLoriCoins >= premio.loriCoins 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-2" 
                    : "text-xs h-7 px-2"}
                >
                  Canjear
                </Button>
              </div>
              {userLoriCoins < premio.loriCoins && (
                <p className="text-xs text-orange-500">
                  Te faltan {(premio.loriCoins - userLoriCoins).toLocaleString()} LC
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Canje Dialog */}
      <Dialog open={canjeDialogOpen} onOpenChange={setCanjeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {!canjeSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  Confirmar Canje
                </DialogTitle>
                <DialogDescription>
                  Estas a punto de canjear tus LoriCoins por este premio
                </DialogDescription>
              </DialogHeader>
              {selectedPremio && (
                <div className="space-y-4 py-4">
                  <div className="relative h-40 rounded-lg overflow-hidden">
                    <Image
                      src={selectedPremio.image}
                      alt={selectedPremio.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedPremio.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPremio.description}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm">Costo:</span>
                    <span className="font-bold text-emerald-600">{selectedPremio.loriCoins.toLocaleString()} LoriCoins</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                    <span className="text-sm">Tu saldo despues del canje:</span>
                    <span className="font-bold">{(userLoriCoins - selectedPremio.loriCoins).toLocaleString()} LC</span>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCanjeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmCanje}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  Confirmar Canje
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-600">Canje Exitoso!</h3>
                <p className="text-muted-foreground">Tu premio ha sido solicitado</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
