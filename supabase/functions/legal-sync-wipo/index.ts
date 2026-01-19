// supabase/functions/legal-sync-wipo/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  officeId: string;
  syncType?: 'full' | 'incremental';
}

interface WIPOLexDocument {
  id: string;
  title: string;
  title_en?: string;
  document_type: string;
  entry_into_force?: string;
  source_url: string;
  content?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { officeId, syncType = 'incremental' } = await req.json() as SyncRequest;

    if (!officeId) {
      return new Response(
        JSON.stringify({ error: 'officeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting WIPO Lex sync for office ${officeId}, type: ${syncType}`);

    // Get office info
    const { data: office, error: officeError } = await supabase
      .from('ipo_offices')
      .select('code, name_short, languages')
      .eq('id', officeId)
      .single();

    if (officeError || !office) {
      throw new Error(`Office not found: ${officeId}`);
    }

    // Create ingestion job
    const { data: job, error: jobError } = await supabase
      .from('legal_ingestion_jobs')
      .insert({
        office_id: officeId,
        job_type: 'wipo_lex_sync',
        status: 'running',
        config: { sync_type: syncType },
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Simulate WIPO Lex API call (in production, call real WIPO Lex API)
    // WIPO Lex API: https://www.wipo.int/wipolex/en/
    const wipoLexDocuments: WIPOLexDocument[] = await fetchWIPOLexDocuments(office.code);

    let processedCount = 0;
    let errorCount = 0;

    for (const doc of wipoLexDocuments) {
      try {
        // Check if document already exists
        const { data: existing } = await supabase
          .from('legal_documents')
          .select('id, content_hash')
          .eq('office_id', officeId)
          .eq('wipo_lex_id', doc.id)
          .single();

        const documentData = {
          office_id: officeId,
          wipo_lex_id: doc.id,
          title: doc.title,
          title_english: doc.title_en,
          document_type: mapDocumentType(doc.document_type),
          level: 'primary' as const,
          status: 'active' as const,
          effective_date: doc.entry_into_force || new Date().toISOString(),
          source_url: doc.source_url,
          source_reliability: 'official' as const,
          ingestion_source: 'wipo_lex' as const,
        };

        if (existing) {
          // Update existing
          await supabase
            .from('legal_documents')
            .update(documentData)
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('legal_documents')
            .insert(documentData);
        }

        processedCount++;
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        errorCount++;
      }
    }

    // Update job status
    await supabase
      .from('legal_ingestion_jobs')
      .update({
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString(),
        documents_processed: processedCount,
        documents_created: processedCount,
        errors: errorCount > 0 ? [{ count: errorCount }] : null,
      })
      .eq('id', job.id);

    console.log(`WIPO Lex sync completed: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        processed: processedCount,
        errors: errorCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('WIPO Lex sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchWIPOLexDocuments(countryCode: string): Promise<WIPOLexDocument[]> {
  // In production, this would call the actual WIPO Lex API
  // For now, return mock data structure
  console.log(`Fetching WIPO Lex documents for country: ${countryCode}`);
  
  // Mock response - in production replace with actual API call
  return [
    {
      id: `${countryCode}-trademark-law`,
      title: 'Ley de Marcas',
      title_en: 'Trademark Law',
      document_type: 'law',
      entry_into_force: '2020-01-01',
      source_url: `https://www.wipo.int/wipolex/en/legislation/details/${countryCode}/trademark-law`,
    },
    {
      id: `${countryCode}-patent-law`,
      title: 'Ley de Patentes',
      title_en: 'Patent Law',
      document_type: 'law',
      entry_into_force: '2019-06-15',
      source_url: `https://www.wipo.int/wipolex/en/legislation/details/${countryCode}/patent-law`,
    },
  ];
}

function mapDocumentType(wipoType: string): string {
  const mapping: Record<string, string> = {
    'law': 'law',
    'regulation': 'regulation',
    'decree': 'decree',
    'order': 'administrative_order',
    'treaty': 'treaty',
    'agreement': 'treaty',
  };
  return mapping[wipoType.toLowerCase()] || 'other';
}
