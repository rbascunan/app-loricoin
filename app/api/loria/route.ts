import { stepCountIs, streamText, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { getSessionUserId } from '@/lib/server/http'
import { saveLoriaMessage } from '@/lib/server/loria-history'

// Initialize Groq client (FREE!)
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// System prompt for LorIA - the financial education AI assistant for kids AND parents
const LORIA_SYSTEM_PROMPT = `Eres LorIA, asistente de educacion financiera para ninos y padres en la app LoriCoin.

PERSONALIDAD:
- Amigable, paciente y entusiasta
- Adaptas tu lenguaje segun quien pregunte (ninos o padres)
- Usas ejemplos practicos del dia a dia

BASE DE CONOCIMIENTO - USA ESTO EN TUS RESPUESTAS:

1. QUE ES EL DINERO:
El dinero es una herramienta de intercambio. NO aparece solo, se obtiene por esfuerzo o valor (trabajo, vender, ayudar).

2. INGRESOS Y EGRESOS:
- Ingresos: mesada, regalos, tareas, ventas
- Egresos: golosinas, juguetes, utiles. No todos son necesarios.

3. AHORRO:
- Regla de oro: Primero ahorrar, despues gastar
- Guardar 10-20% de la mesada
- Datos: $10/semana = $520/ano, $20/semana = $1040/ano

4. LA REGLA 50-30-20:
- 50% necesidades
- 30% gustos
- 20% ahorro

5. NECESIDAD VS DESEO:
- Necesidades: comida, ropa basica, utiles
- Deseos: juguetes, videojuegos, golosinas extras
- Preguntarse: "Lo necesito o solo lo quiero?"

6. INVERSION PARA NINOS:
- Ejemplos: hacer pulseras y venderlas, limonada, dibujos
- Interes compuesto: bola de nieve que crece

7. HABITOS FINANCIEROS:
- Registrar gastos, pensar antes de comprar, ahorrar siempre
- "No importa CUANTO dinero tengas, sino COMO lo usas"

8. PARA PADRES - Mesadas por edad:
- 6-8 anos: $50-100/semana
- 9-11 anos: $100-200/semana  
- 12+ anos: $200-500/semana

9. ENSENAR POR EDAD:
- 3-5 anos: alcancia transparente, juegos de tienda
- 6-10 anos: mesada semanal, dividir dinero (gastar/ahorrar/compartir)
- 11+ anos: presupuesto basico, cuentas bancarias

10. ACTIVIDADES FAMILIARES:
- Presupuesto semanal, alcancia familiar, detective de precios en super
- Juego "Que harias con $500?", mini emprendimientos

11. EMPRENDIMIENTO INFANTIL:
Ideas: dibujos, pulseras, limonada, pasear perros, lavar autos
Pasos: elegir producto, calcular costo, poner precio, vender, reinvertir

12. LORICOINS:
- Completar tareas: +50 LC
- Mantener podio 5 dias: +20 LC
- Deposito: +50 LC
- Lecciones: +30 LC
- Meta cumplida: +100 LC

FORMATO (MUY IMPORTANTE):
- Escribe como una persona cercana que conversa, no como un manual.
- Usa parrafos cortos. Usa listas simples con "-" solo cuando ayuden de verdad.
- NO uses titulos con "#", tablas ni separadores "---".
- Usa **negrita** con moderacion, solo para 2 o 3 palabras clave por respuesta.
- Ejemplos concretos con numeros.
- Termina con una pregunta corta para seguir la charla.
- Maximo 150 palabras por respuesta.`

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return Response.json({ error: 'Tenés que iniciar sesión' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const rawMessages = body?.messages || []

    if (!Array.isArray(rawMessages) || rawMessages.length === 0 || JSON.stringify(rawMessages).length > 50_000) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const messages = rawMessages.slice(-20)

    const lastUser = messages[messages.length - 1]
    if (lastUser?.role === 'user' && typeof lastUser.content === 'string') {
      await saveLoriaMessage(userId, 'user', lastUser.content)
    }

    const result = streamText({
      onFinish: async ({ text }) => {
        await saveLoriaMessage(userId, 'assistant', text)
      },
      // Groq retired llama-3.3-70b-versatile for this key; GROQ_MODEL lets us swap without a deploy.
      model: groq(process.env.GROQ_MODEL || 'openai/gpt-oss-120b'),
      system: LORIA_SYSTEM_PROMPT,
      messages: messages,
      tools: {
        searchNotionLessons: tool({
          description: 'Busca lecciones educativas sobre finanzas en Notion. Usa esto cuando el usuario quiere aprender sobre un tema especifico como ahorro, presupuesto, inversion, etc.',
          inputSchema: z.object({
            topic: z.string().describe('El tema a buscar, por ejemplo: ahorro, presupuesto, inversion, gastos'),
          }),
          execute: async ({ topic }) => {
            // This will be connected to Notion MCP
            // For now, return educational content based on the topic
            const lessons: Record<string, { title: string; content: string; tip: string }> = {
              ahorro: {
                title: 'El Arte del Ahorro',
                content: 'Ahorrar es guardar una parte del dinero que recibes para usarlo mas tarde. Es como plantar una semilla que crece con el tiempo.',
                tip: 'Intenta ahorrar al menos el 10% de tu mesada cada semana. Si recibes $100, guarda $10!',
              },
              presupuesto: {
                title: 'Tu Primer Presupuesto',
                content: 'Un presupuesto es un plan para tu dinero. Te ayuda a saber cuanto tienes, cuanto gastas y cuanto puedes ahorrar.',
                tip: 'Usa la regla 50-30-20: 50% para necesidades, 30% para gustos, 20% para ahorro.',
              },
              inversion: {
                title: 'Introduccion a la Inversion',
                content: 'Invertir es poner tu dinero a trabajar para que crezca. Cuando inviertes, tu dinero puede generar mas dinero con el tiempo.',
                tip: 'Empieza aprendiendo sobre el interes compuesto: es como una bola de nieve que crece mientras rueda!',
              },
              gastos: {
                title: 'Gastos Inteligentes',
                content: 'No todos los gastos son iguales. Hay necesidades (cosas que necesitas) y deseos (cosas que quieres). Aprender a diferenciarlos te ayudara a gastar mejor.',
                tip: 'Antes de comprar algo, espera 24 horas. Si todavia lo quieres al dia siguiente, probablemente vale la pena.',
              },
            }

            const normalizedTopic = topic.toLowerCase()
            const lesson = lessons[normalizedTopic] || lessons['ahorro']

            return {
              found: true,
              lesson: lesson,
              loriCoinsReward: 15,
              source: 'Notion - Biblioteca LoriCoin',
            }
          },
        }),
        createNotionLesson: tool({
          description: 'Crea una nueva leccion educativa en Notion para que el usuario pueda consultarla despues.',
          inputSchema: z.object({
            title: z.string().describe('Titulo de la leccion'),
            content: z.string().describe('Contenido educativo de la leccion'),
            category: z.enum(['ahorro', 'presupuesto', 'inversion', 'gastos', 'general']).describe('Categoria de la leccion'),
          }),
          execute: async ({ title, content, category }) => {
            // This will be connected to Notion MCP to create a page
            return {
              success: true,
              message: `Leccion "${title}" creada en Notion`,
              category,
              loriCoinsReward: 20,
            }
          },
        }),
        getSavingsTips: tool({
          description: 'Obtiene consejos personalizados de ahorro basados en el contexto del usuario.',
          inputSchema: z.object({
            currentSavings: z.number().optional().describe('Ahorros actuales del usuario'),
            savingsGoal: z.number().optional().describe('Meta de ahorro del usuario'),
          }),
          execute: async ({ currentSavings, savingsGoal }) => {
            const tips = [
              'Guarda las monedas sueltas en una alcancia - se acumulan mas rapido de lo que crees!',
              'Establece una meta especifica: es mas motivador ahorrar para algo concreto.',
              'Convierte el ahorro en un juego: cada semana intenta ahorrar un poco mas que la anterior.',
              'Usa la tecnica del "dinero invisible": transfiere a ahorro antes de poder gastarlo.',
              'Celebra cada pequeno logro - cada peso ahorrado cuenta!',
            ]

            let personalizedTip = ''
            if (currentSavings && savingsGoal) {
              const progress = (currentSavings / savingsGoal) * 100
              if (progress < 25) {
                personalizedTip = 'Estas empezando tu viaje de ahorro. Cada peso cuenta!'
              } else if (progress < 50) {
                personalizedTip = 'Ya llevas un cuarto del camino. Sigue asi!'
              } else if (progress < 75) {
                personalizedTip = 'Mas de la mitad! Tu meta esta cada vez mas cerca.'
              } else {
                personalizedTip = 'Casi lo logras! Un ultimo esfuerzo y alcanzaras tu meta.'
              }
            }

            return {
              tips: tips.slice(0, 3),
              personalizedTip,
              loriCoinsReward: 5,
            }
          },
        }),
      },
      stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[LorIA] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al procesar tu mensaje' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
