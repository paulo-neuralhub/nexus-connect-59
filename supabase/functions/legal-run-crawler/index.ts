// supabase/functions/legal-run-crawler/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlerRequest {
  officeId: string;
  crawlerType?: 'legislation' | 'fees' | 'forms' | 'all';
  targetUrls?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { officeId, crawlerType = 'all', targetUrls } = await req.json() as CrawlerRequest;

    if (!officeId) {
      return new Response(
        JSON.stringify({ error: 'officeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting legal crawler for office ${officeId}, type: ${crawlerType}`);

    // Get office info and connection methods
    const { data: office, error: officeError } = await supabase
      .from('ipo_offices')
      .select(`
        *,
        connection_methods:ipo_connection_methods(
          scraper_config:ipo_scraper_configs(*)
        )
      `)
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
        job_type: 'legal_crawler',
        status: 'running',
        config: { 
          crawler_type: crawlerType,
          target_urls: targetUrls || [],
        },
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Determine URLs to crawl
    const urlsToCrawl = targetUrls || getDefaultCrawlUrls(office, crawlerType);

    let processedCount = 0;
    let errorCount = 0;
    const discoveredDocuments: any[] = [];

    for (const url of urlsToCrawl) {
      try {
        console.log(`Crawling: ${url}`);
        
        // In production, this would use a real crawler/scraper
        // For now, simulate crawling
        const crawlResult = await simulateCrawl(url, crawlerType);
        
        if (crawlResult.documents) {
          for (const doc of crawlResult.documents) {
            // Check for existing document
            const { data: existing } = await supabase
              .from('legal_documents')
              .select('id')
              .eq('office_id', officeId)
              .eq('source_url', doc.source_url)
              .single();

            if (!existing) {
              const { data: newDoc, error: insertError } = await supabase
                .from('legal_documents')
                .insert({
                  office_id: officeId,
                  title: doc.title,
                  document_type: doc.document_type,
                  level: doc.level || 'secondary',
                  status: 'active',
                  effective_date: doc.effective_date || new Date().toISOString(),
                  source_url: doc.source_url,
                  source_reliability: 'official',
                  ingestion_source: 'legal_crawler',
                  content_original: doc.content,
                })
                .select()
                .single();

              if (newDoc) {
                discoveredDocuments.push(newDoc);
                
                // Create change alert for new document
                await supabase
                  .from('legal_change_alerts')
                  .insert({
                    office_id: officeId,
                    document_id: newDoc.id,
                    alert_type: 'new_document',
                    title: `Nuevo documento: ${doc.title}`,
                    description: `Se ha detectado un nuevo documento legal en ${office.name_short}`,
                    impact_level: 'medium',
                    status: 'pending',
                  });
              }
            }
            processedCount++;
          }
        }

        // Check for fee updates
        if (crawlResult.fees && (crawlerType === 'fees' || crawlerType === 'all')) {
          for (const fee of crawlResult.fees) {
            await processFeeCrawlResult(supabase, officeId, fee);
          }
        }

        // Check for form updates  
        if (crawlResult.forms && (crawlerType === 'forms' || crawlerType === 'all')) {
          for (const form of crawlResult.forms) {
            await processFormCrawlResult(supabase, officeId, form);
          }
        }

      } catch (crawlError) {
        console.error(`Error crawling ${url}:`, crawlError);
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
        documents_created: discoveredDocuments.length,
        errors: errorCount > 0 ? [{ count: errorCount }] : null,
      })
      .eq('id', job.id);

    console.log(`Legal crawler completed: ${processedCount} processed, ${discoveredDocuments.length} created, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        processed: processedCount,
        created: discoveredDocuments.length,
        errors: errorCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Legal crawler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDefaultCrawlUrls(office: any, crawlerType: string): string[] {
  const urls: string[] = [];
  
  if (office.website_official) {
    urls.push(office.website_official);
  }
  
  // Add known legal resource URLs based on office
  if (crawlerType === 'fees' || crawlerType === 'all') {
    urls.push(`${office.website_official}/fees`);
    urls.push(`${office.website_official}/tasas`);
  }
  
  if (crawlerType === 'forms' || crawlerType === 'all') {
    urls.push(`${office.website_official}/forms`);
    urls.push(`${office.website_official}/formularios`);
  }
  
  return urls.filter(u => u);
}

async function simulateCrawl(url: string, crawlerType: string): Promise<any> {
  // In production, this would use Puppeteer/Playwright or a scraping service
  // For now, return mock structure
  
  return {
    documents: [
      {
        title: `Documento descubierto en ${url}`,
        document_type: 'practice_note',
        level: 'secondary',
        source_url: url,
        content: 'Contenido del documento...',
        effective_date: new Date().toISOString(),
      }
    ],
    fees: crawlerType === 'fees' || crawlerType === 'all' ? [
      {
        fee_type: 'application_fee',
        ip_type: 'trademark',
        amount: 250,
        currency: 'EUR',
      }
    ] : [],
    forms: crawlerType === 'forms' || crawlerType === 'all' ? [
      {
        form_code: 'TM-001',
        name: 'Solicitud de marca',
        ip_type: 'trademark',
        url: `${url}/forms/tm-001`,
      }
    ] : [],
  };
}

async function processFeeCrawlResult(supabase: any, officeId: string, fee: any) {
  // Check if fee exists and has changed
  const { data: existing } = await supabase
    .from('ipo_official_fees')
    .select('*')
    .eq('office_id', officeId)
    .eq('fee_type', fee.fee_type)
    .eq('ip_type', fee.ip_type)
    .single();

  if (existing) {
    if (existing.amount !== fee.amount) {
      // Record fee change in history
      await supabase
        .from('legal_fee_history')
        .insert({
          office_id: officeId,
          fee_type: fee.fee_type,
          ip_type: fee.ip_type,
          old_amount: existing.amount,
          new_amount: fee.amount,
          currency: fee.currency,
          change_date: new Date().toISOString(),
          source: 'legal_crawler',
        });

      // Update fee
      await supabase
        .from('ipo_official_fees')
        .update({ amount: fee.amount })
        .eq('id', existing.id);

      // Create alert
      await supabase
        .from('legal_change_alerts')
        .insert({
          office_id: officeId,
          alert_type: 'fee_update',
          title: `Cambio de tasa: ${fee.fee_type}`,
          description: `La tasa ${fee.fee_type} cambió de ${existing.amount} a ${fee.amount} ${fee.currency}`,
          impact_level: 'high',
          status: 'pending',
        });
    }
  } else {
    // Insert new fee
    await supabase
      .from('ipo_official_fees')
      .insert({
        office_id: officeId,
        ...fee,
      });
  }
}

async function processFormCrawlResult(supabase: any, officeId: string, form: any) {
  // Check if form exists
  const { data: existing } = await supabase
    .from('legal_official_forms')
    .select('*')
    .eq('office_id', officeId)
    .eq('form_code', form.form_code)
    .single();

  if (!existing) {
    await supabase
      .from('legal_official_forms')
      .insert({
        office_id: officeId,
        form_code: form.form_code,
        name: form.name,
        ip_type: form.ip_type,
        download_url: form.url,
        is_mandatory: true,
        status: 'active',
      });
  }
}
