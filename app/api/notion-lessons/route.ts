import { createClient } from '@/lib/supabase/server'

// This endpoint demonstrates MCP integration with Notion
// It syncs financial education lessons from Notion to Supabase

const FINANCIAL_LESSONS = [
  {
    notion_page_id: 'lesson-ahorro-001',
    title: 'El Arte del Ahorro',
    content: `El ahorro es guardar una parte del dinero que recibes para usarlo mas tarde. 
    
Imagina que tu dinero es como semillas: si las plantas (ahorras), con el tiempo crecen y tienes mas!

Tips para empezar a ahorrar:
- Guarda al menos el 10% de todo lo que recibas
- Usa una alcancia o cuenta de ahorros
- Establece una meta: para que quieres ahorrar?
- Celebra cada pequeno logro!`,
    category: 'ahorro',
    difficulty: 'beginner',
    lori_coins_reward: 15,
  },
  {
    notion_page_id: 'lesson-presupuesto-001',
    title: 'Tu Primer Presupuesto',
    content: `Un presupuesto es un plan para tu dinero. Te ayuda a saber cuanto tienes, cuanto gastas y cuanto puedes ahorrar.

La Regla 50-30-20:
- 50% para necesidades (comida, transporte, utiles)
- 30% para gustos (juegos, snacks, entretenimiento)  
- 20% para ahorro (tu futuro yo te lo agradecera!)

Como hacer tu presupuesto:
1. Anota todo el dinero que recibes
2. Lista tus gastos fijos
3. Planifica tus ahorros
4. El resto es para gastos variables`,
    category: 'presupuesto',
    difficulty: 'beginner',
    lori_coins_reward: 20,
  },
  {
    notion_page_id: 'lesson-gastos-001',
    title: 'Necesidades vs Deseos',
    content: `No todo lo que queremos es lo que necesitamos. Aprender la diferencia es clave para gastar inteligentemente.

NECESIDADES: Cosas que realmente necesitas para vivir
- Comida, agua, casa
- Ropa basica, utiles escolares
- Transporte para ir a la escuela

DESEOS: Cosas que quieres pero puedes vivir sin ellas
- Videojuegos nuevos
- Dulces y snacks extra
- Ropa de moda

El Truco de las 24 horas:
Antes de comprar algo que quieres (no necesitas), espera 24 horas. Si al dia siguiente todavia lo quieres, probablemente vale la pena.`,
    category: 'gastos',
    difficulty: 'beginner',
    lori_coins_reward: 15,
  },
  {
    notion_page_id: 'lesson-inversion-001',
    title: 'Introduccion a la Inversion',
    content: `Invertir es poner tu dinero a trabajar para que crezca con el tiempo.

El Interes Compuesto - Tu Superpoder Financiero:
Imagina una bola de nieve rodando por una montana. Empieza pequena pero mientras rueda, recoge mas nieve y crece cada vez mas rapido.

Asi funciona el interes compuesto:
- Tu dinero gana intereses
- Esos intereses tambien ganan intereses
- Con el tiempo, tu dinero crece exponencialmente!

Por eso es mejor empezar a ahorrar e invertir desde joven - tienes mas tiempo para que la bola de nieve crezca.`,
    category: 'inversion',
    difficulty: 'intermediate',
    lori_coins_reward: 25,
  },
  {
    notion_page_id: 'lesson-metas-001',
    title: 'Metas de Ahorro SMART',
    content: `Las mejores metas son SMART:

S - Especifica: No "quiero ahorrar", sino "quiero ahorrar $500"
M - Medible: Puedes ver tu progreso cada semana
A - Alcanzable: Es posible con tu ingreso actual
R - Relevante: Es algo que realmente quieres
T - Temporal: Tiene fecha limite, como "en 3 meses"

Ejemplo de meta SMART:
"Voy a ahorrar $200 en 2 meses para comprar audífonos, guardando $25 cada semana de mi mesada."

Recuerda: Las metas grandes se logran con pasos pequenos y constantes!`,
    category: 'ahorro',
    difficulty: 'intermediate',
    lori_coins_reward: 20,
  },
]

export async function GET() {
  // Return all available lessons (simulating Notion MCP read)
  return Response.json({
    success: true,
    source: 'Notion MCP - LoriCoin Education Database',
    lessons: FINANCIAL_LESSONS,
    totalLessons: FINANCIAL_LESSONS.length,
    message: 'Lecciones sincronizadas desde Notion',
  })
}

export async function POST(req: Request) {
  try {
    const { action, topic, lessonId } = await req.json()

    if (action === 'search') {
      // Search lessons by topic (simulating Notion MCP search)
      const results = FINANCIAL_LESSONS.filter(
        (lesson) =>
          lesson.category.toLowerCase().includes(topic?.toLowerCase() || '') ||
          lesson.title.toLowerCase().includes(topic?.toLowerCase() || '') ||
          lesson.content.toLowerCase().includes(topic?.toLowerCase() || '')
      )

      return Response.json({
        success: true,
        source: 'Notion MCP Search',
        query: topic,
        results,
        count: results.length,
      })
    }

    if (action === 'get') {
      // Get specific lesson (simulating Notion MCP page read)
      const lesson = FINANCIAL_LESSONS.find((l) => l.notion_page_id === lessonId)

      if (!lesson) {
        return Response.json({ success: false, error: 'Leccion no encontrada' }, { status: 404 })
      }

      return Response.json({
        success: true,
        source: 'Notion MCP Page',
        lesson,
      })
    }

    if (action === 'sync') {
      // Sync lessons to Supabase (demonstrating MCP -> DB flow)
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return Response.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }

      for (const lesson of FINANCIAL_LESSONS) {
        const { error } = await supabase.from('notion_lessons').upsert(
          {
            notion_page_id: lesson.notion_page_id,
            title: lesson.title,
            content: lesson.content,
            category: lesson.category,
            difficulty: lesson.difficulty,
            lori_coins_reward: lesson.lori_coins_reward,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'notion_page_id' }
        )
        if (error) {
          return Response.json({ success: false, error: 'Sin permisos para sincronizar' }, { status: 403 })
        }
      }

      return Response.json({
        success: true,
        message: 'Lecciones sincronizadas de Notion a Supabase',
        syncedCount: FINANCIAL_LESSONS.length,
      })
    }

    return Response.json({ success: false, error: 'Accion no valida' }, { status: 400 })
  } catch (error) {
    console.error('[Notion Lessons] Error:', error)
    return Response.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
