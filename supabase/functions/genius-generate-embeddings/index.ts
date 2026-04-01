import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

    // 1. Leer registros sin embedding de genius_knowledge_global
    const { data: globalRecords } = await supabase
      .from('genius_knowledge_global')
      .select('id, title, content, jurisdiction_code')
      .is('embedding', null)
      .eq('is_active', true)
      .limit(50)

    // 2. Leer registros sin embedding de genius_knowledge_tenant
    const { data: tenantRecords } = await supabase
      .from('genius_knowledge_tenant')
      .select('id, title, content_chunk, jurisdiction_code')
      .is('embedding', null)
      .eq('is_active', true)
      .limit(50)

    const allRecords = [
      ...(globalRecords ?? []).map(r => ({
        id: r.id,
        table: 'genius_knowledge_global',
        text: `${r.title}\n\n${r.content}`
      })),
      ...(tenantRecords ?? []).map(r => ({
        id: r.id,
        table: 'genius_knowledge_tenant',
        text: `${r.title}\n\n${r.content_chunk}`
      }))
    ]

    if (allRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No records pending embedding', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
      )
    }

    // 3. Generar embeddings en batch (OpenAI text-embedding-3-small)
    const texts = allRecords.map(r => r.text.slice(0, 8000))

    const embeddingRes = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: texts,
          dimensions: 1536
        })
      }
    )

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const embeddingData = await embeddingRes.json()
    const embeddings = embeddingData.data

    // 4. Actualizar registros con embeddings
    const updateResults = await Promise.allSettled(
      allRecords.map(async (record, i) => {
        const vector = embeddings[i]?.embedding
        if (!vector) return { id: record.id, status: 'no_vector' }

        const { error } = await supabase
          .from(record.table)
          .update({ embedding: JSON.stringify(vector) })
          .eq('id', record.id)

        return {
          id: record.id,
          table: record.table,
          status: error ? 'error' : 'success',
          error: error?.message
        }
      })
    )

    const succeeded = updateResults
      .filter(r => r.status === 'fulfilled' &&
        (r.value as any)?.status === 'success').length
    const failed = allRecords.length - succeeded

    // 5. Log en ai_request_logs (fire & forget)
    supabase.from('ai_request_logs').insert({
      model_id: 'text-embedding-3-small',
      provider_id: 'openai',
      input_tokens: texts.join('').length / 4,
      output_tokens: 0,
      cost_cents: Math.round(texts.join('').length / 4 * 0.002 / 1000 * 100),
      duration_ms: 0,
      status: 'success'
    }).then(() => {}).catch(() => {})

    return new Response(
      JSON.stringify({
        processed: succeeded,
        failed,
        total: allRecords.length,
        details: updateResults.map(r =>
          r.status === 'fulfilled' ? r.value : { status: 'rejected' }
        )
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS }
      }
    )

  } catch (error) {
    console.error('genius-generate-embeddings error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    )
  }
})
