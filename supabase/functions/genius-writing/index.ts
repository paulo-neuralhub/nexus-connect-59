import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ACTION_PROMPTS: Record<string, string> = {
  rewrite: 'Reescribe el siguiente texto manteniendo el mismo significado pero mejorando el estilo, fluidez y claridad. Mantén el mismo idioma. Devuelve SOLO el texto reescrito, sin explicaciones.',
  correct: 'Corrige todos los errores de gramática, ortografía y puntuación del siguiente texto. Mantén el estilo y tono original. Devuelve SOLO el texto corregido, sin explicaciones.',
  improve: 'Mejora el siguiente texto haciéndolo más profesional, formal y pulido. Apropiado para correspondencia empresarial. Devuelve SOLO el texto mejorado, sin explicaciones.',
  simplify: 'Simplifica el siguiente texto haciéndolo más claro, directo y fácil de entender. Elimina redundancias. Devuelve SOLO el texto simplificado, sin explicaciones.',
  expand: 'Expande el siguiente texto con más detalle, contexto y elaboración. Mantén el mismo tono y estilo. Devuelve SOLO el texto expandido, sin explicaciones.',
  shorten: 'Condensa el siguiente texto manteniendo las ideas principales pero usando menos palabras. Devuelve SOLO el texto condensado, sin explicaciones.',
  legal_tone: 'Reescribe el siguiente texto en tono legal formal, apropiado para correspondencia de propiedad intelectual entre profesionales. Usa terminología jurídica precisa. Devuelve SOLO el texto reescrito, sin explicaciones.',
  full_draft: 'Eres un abogado experto en propiedad intelectual. Redacta un email profesional completo basado en las instrucciones del usuario. Incluye saludo, cuerpo estructurado y despedida formal. Devuelve el email completo en HTML con formato apropiado (<p>, <br>, <strong> etc).',
}

function getTranslatePrompt(targetLang: string): string {
  const langNames: Record<string, string> = {
    en: 'inglés', es: 'español', pt: 'portugués', fr: 'francés', de: 'alemán',
  }
  const name = langNames[targetLang] || targetLang
  return `Traduce el siguiente texto al ${name}. Mantén el formato y tono. Devuelve SOLO la traducción, sin explicaciones.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action, text, target_language, context, draft_type, draft_prompt } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Build prompt
    let systemPrompt: string
    if (action === 'translate') {
      systemPrompt = getTranslatePrompt(target_language || 'en')
    } else if (action === 'full_draft') {
      systemPrompt = ACTION_PROMPTS.full_draft
    } else {
      systemPrompt = ACTION_PROMPTS[action]
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Add context
    if (context) {
      systemPrompt += `\n\nContexto adicional: Estás en la aplicación IP-NEXUS (gestión de propiedad intelectual).`
      if (context.matter_id) systemPrompt += ` Expediente: ${context.matter_id}.`
      if (context.email_subject) systemPrompt += ` Asunto del email: ${context.email_subject}.`
    }

    const userMessage = action === 'full_draft'
      ? `Tipo de email: ${draft_type || 'general'}\n\nInstrucciones: ${draft_prompt || text || 'Redacta un email profesional'}`
      : text

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Use LOVABLE_API_KEY (AI Gateway) first, fallback to other providers
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    let resultText: string

    if (lovableKey) {
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
        }),
      })

      if (!resp.ok) {
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429, headers: { ...CORS, 'Content-Type': 'application/json' },
          })
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required. Please add funds.' }), {
            status: 402, headers: { ...CORS, 'Content-Type': 'application/json' },
          })
        }
        throw new Error(`AI Gateway error: ${resp.status}`)
      }

      const data = await resp.json()
      resultText = data.choices?.[0]?.message?.content || ''
    } else if (anthropicKey) {
      const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk@0.27.3')
      const anthropic = new Anthropic({ apiKey: anthropicKey })
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })
      resultText = msg.content[0]?.text || ''
    } else {
      return new Response(JSON.stringify({ error: 'No AI provider configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      result: resultText.trim(),
      action,
      original: text || '',
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('genius-writing error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: (error as Error).message,
    }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
