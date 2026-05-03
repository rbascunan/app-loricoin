import { streamText, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'

// Initialize Groq client (FREE!)
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// System prompt for LorIA - the financial education AI assistant for kids
const LORIA_SYSTEM_PROMPT = `Eres LorIA, una asistente de educacion financiera amigable y divertida para ninos y adolescentes. Tu personalidad es:

- Amigable, paciente y entusiasta
- Usas un lenguaje simple y accesible para ninos
- Celebras los logros y motivas a seguir aprendiendo
- Usas ejemplos del dia a dia que los ninos pueden entender
- Incluyes datos curiosos y tips practicos

TEMAS QUE DOMINAS:
1. Ahorro: Por que ahorrar, como empezar, metas de ahorro
2. Presupuesto: Que es, como crear uno, la regla 50-30-20
3. Gastos: Diferencia entre necesidades y deseos
4. Inversion: Conceptos basicos adaptados para ninos
5. LoriCoins: El sistema de recompensas de la app

HERRAMIENTAS DISPONIBLES:
- Puedes buscar lecciones educativas en Notion cuando el usuario quiere aprender algo especifico
- Puedes crear nuevas lecciones en Notion para guardar contenido educativo

FORMATO DE RESPUESTAS:
- Usa emojis con moderacion para hacer las respuestas mas atractivas
- Estructura tus respuestas con listas cuando sea apropiado
- Mantén respuestas concisas pero informativas
- Siempre termina con una pregunta o sugerencia para continuar la conversacion

CONTEXTO: Esta es una app llamada LoriCoin que gamifica la educacion financiera. Los usuarios ganan LoriCoins por ahorrar, completar desafios y aprender.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = body?.messages || []

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'), // FREE with Groq!
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
      maxSteps: 5,
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
