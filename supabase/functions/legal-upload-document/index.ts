// supabase/functions/legal-upload-document/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  officeId: string;
  title: string;
  titleEnglish?: string;
  documentType: string;
  level: 'primary' | 'secondary' | 'operational';
  content: string;
  contentFormat?: 'text' | 'html' | 'markdown';
  effectiveDate?: string;
  officialNumber?: string;
  ipTypes?: string[];
  sourceUrl?: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json() as UploadRequest;

    if (!body.officeId || !body.title || !body.documentType || !body.level || !body.content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: officeId, title, documentType, level, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Uploading legal document for office ${body.officeId}: ${body.title}`);

    // Create ingestion job
    const { data: job, error: jobError } = await supabase
      .from('legal_ingestion_jobs')
      .insert({
        office_id: body.officeId,
        job_type: 'manual_upload',
        status: 'running',
        config: {
          title: body.title,
          document_type: body.documentType,
          uploaded_by: userId,
        },
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Calculate content hash for deduplication
    const contentHash = await calculateHash(body.content);

    // Check for duplicate
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('office_id', body.officeId)
      .eq('content_hash', contentHash)
      .single();

    if (existing) {
      await supabase
        .from('legal_ingestion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          errors: [{ message: 'Duplicate document detected' }],
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          error: 'Duplicate document',
          existingId: existing.id 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create legal document
    const { data: document, error: docError } = await supabase
      .from('legal_documents')
      .insert({
        office_id: body.officeId,
        title: body.title,
        title_english: body.titleEnglish,
        document_type: body.documentType,
        level: body.level,
        official_number: body.officialNumber,
        effective_date: body.effectiveDate || new Date().toISOString(),
        status: 'active',
        ip_types: body.ipTypes || [],
        source_url: body.sourceUrl,
        file_url: body.fileUrl,
        content_original: body.content,
        content_format: body.contentFormat || 'text',
        content_hash: contentHash,
        source_reliability: 'manual',
        ingestion_source: 'manual_upload',
        metadata: body.metadata,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create RAG chunks for AI indexing
    const chunks = await chunkContent(body.content, body.contentFormat || 'text');
    
    for (let i = 0; i < chunks.length; i++) {
      await supabase
        .from('legal_rag_chunks')
        .insert({
          document_id: document.id,
          office_id: body.officeId,
          chunk_index: i,
          content: chunks[i].text,
          token_count: estimateTokens(chunks[i].text),
          section_path: chunks[i].sectionPath,
          metadata: chunks[i].metadata,
        });
    }

    // Update document with chunk count
    await supabase
      .from('legal_documents')
      .update({
        is_indexed: true,
        chunk_count: chunks.length,
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', document.id);

    // Update job status
    await supabase
      .from('legal_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        documents_processed: 1,
        documents_created: 1,
        chunks_created: chunks.length,
      })
      .eq('id', job.id);

    console.log(`Document uploaded successfully: ${document.id}, ${chunks.length} chunks created`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId: document.id,
        jobId: job.id,
        chunksCreated: chunks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Document upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ContentChunk {
  text: string;
  sectionPath?: string;
  metadata?: Record<string, any>;
}

async function chunkContent(content: string, format: string): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = [];
  const chunkSize = 1000; // ~tokens, roughly 4 chars per token
  const chunkOverlap = 200;
  
  // Simple chunking by paragraphs/sections
  const paragraphs = content.split(/\n\n+/);
  
  let currentChunk = '';
  let currentSection = '';
  let chunkIndex = 0;
  
  for (const para of paragraphs) {
    // Check for section headers (simple heuristic)
    const sectionMatch = para.match(/^(Artículo|Article|Capítulo|Chapter|Sección|Section)\s+[\dIVXLC]+/i);
    if (sectionMatch) {
      currentSection = sectionMatch[0];
    }
    
    if (currentChunk.length + para.length > chunkSize * 4) {
      // Save current chunk
      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          sectionPath: currentSection || undefined,
          metadata: { chunkIndex },
        });
        chunkIndex++;
      }
      
      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(chunkOverlap / 4));
      currentChunk = overlapWords.join(' ') + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      sectionPath: currentSection || undefined,
      metadata: { chunkIndex },
    });
  }
  
  return chunks;
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
