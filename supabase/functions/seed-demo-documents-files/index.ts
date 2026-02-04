// seed-demo-documents-files - Genera PDFs reales para los documentos demo
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ORG_ID = 'd0000001-0000-0000-0000-000000000001';
const BUCKET = 'matter-documents';

// Escape special PDF characters and normalize accents
function escapePDF(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[Ñ]/g, 'N')
    .replace(/[Á]/g, 'A')
    .replace(/[É]/g, 'E')
    .replace(/[Í]/g, 'I')
    .replace(/[Ó]/g, 'O')
    .replace(/[Ú]/g, 'U')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/€/g, 'EUR')
    .replace(/[^\x20-\x7E]/g, '') // Remove any remaining non-ASCII
    .substring(0, 80);
}

// Generate a minimal valid PDF with text content
function createPDF(title: string, sections: { heading?: string; content: string }[], footer: string): Uint8Array {
  let textContent = '';
  let y = 780;
  
  // Title
  textContent += `BT\n/F1 16 Tf\n50 ${y} Td\n(${escapePDF(title)}) Tj\nET\n`;
  y -= 30;
  
  // Horizontal line
  textContent += `q\n0.8 0.8 0.8 RG\n50 ${y} m\n545 ${y} l\nS\nQ\n`;
  y -= 20;
  
  // Sections
  for (const section of sections) {
    if (y < 80) break;
    
    if (section.heading) {
      textContent += `BT\n/F1 12 Tf\n50 ${y} Td\n(${escapePDF(section.heading)}) Tj\nET\n`;
      y -= 18;
    }
    
    // Content lines
    const lines = section.content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (y < 60) break;
      const chunks = line.match(/.{1,85}/g) || [line];
      for (const chunk of chunks) {
        if (y < 60) break;
        textContent += `BT\n/F1 10 Tf\n50 ${y} Td\n(${escapePDF(chunk)}) Tj\nET\n`;
        y -= 14;
      }
    }
    y -= 10;
  }
  
  // Footer
  textContent += `BT\n/F1 8 Tf\n50 30 Td\n(${escapePDF(footer)}) Tj\nET\n`;
  
  const stream = textContent;
  const streamBytes = new TextEncoder().encode(stream);
  const streamLength = streamBytes.length;
  
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${stream}endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000232 00000 n 
0000000${(295 + streamLength).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${365 + streamLength}
%%EOF`;
  
  return new TextEncoder().encode(pdf);
}

// Document content templates
function getDocContent(doc: any): { title: string; sections: { heading?: string; content: string }[] } {
  const ref = doc.matters?.reference || 'N/A';
  const matterTitle = doc.matters?.title || doc.name;
  const category = doc.category || 'general';
  const today = new Date().toLocaleDateString('es-ES');
  
  const templates: Record<string, () => { title: string; sections: { heading?: string; content: string }[] }> = {
    case_opening: () => ({
      title: 'FICHA DE APERTURA DE EXPEDIENTE',
      sections: [
        { heading: 'DATOS DEL EXPEDIENTE', content: `Referencia interna: ${ref}\nTitulo: ${matterTitle}\nTipo: Marca / Patente\nOficina destino: OEPM / EUIPO / EPO` },
        { heading: 'CLIENTE', content: `Empresa: [Ver ficha de cliente vinculada]\nContacto principal: [Ver contacto asignado]\nDomicilio: [Direccion fiscal]` },
        { heading: 'OBJETO', content: `Registro de marca/patente denominada "${matterTitle}" ante la oficina\ncorrespondiente en las clases/categorias indicadas.` },
        { heading: 'OBSERVACIONES', content: `Expediente abierto correctamente.\nPendiente busqueda de anterioridades.\nSe solicitara poder de representacion al cliente.` }
      ]
    }),
    
    search_report: () => ({
      title: 'INFORME DE BUSQUEDA DE ANTERIORIDADES',
      sections: [
        { heading: '1. OBJETO', content: `Busqueda de anterioridades para: ${matterTitle}\nReferencia: ${ref}` },
        { heading: '2. BASES DE DATOS CONSULTADAS', content: `- OEPM: Base de datos de marcas nacionales espanolas\n- TMView: Base de datos europea de marcas\n- WIPO Global Brand Database: Marcas internacionales\n- Google Patents: Referencias tecnicas` },
        { heading: '3. RESULTADOS', content: `Se han analizado las marcas registradas y solicitudes pendientes\nen las clases Nice relevantes.\n\nNo se han identificado conflictos criticos.\nRiesgo general de oposicion: BAJO-MEDIO` },
        { heading: '4. CONCLUSION Y RECOMENDACION', content: `Se recomienda proceder con la solicitud.\nMonitorizar marcas similares durante el periodo de oposicion.` }
      ]
    }),
    
    power_of_attorney: () => ({
      title: 'PODER DE REPRESENTACION',
      sections: [
        { content: `PODER DE REPRESENTACION ANTE OFICINAS DE PI` },
        { content: `El/La abajo firmante, en calidad de representante legal de la entidad,\notorga poder especial a:\n\nMERIDIAN IP CONSULTING S.L.\nCIF: B-12345678\nC/ Gran Via 123, 28001 Madrid\n\npara actuar en su nombre y representacion ante la OEPM, EUIPO,\nEPO, WIPO y demas oficinas de propiedad industrial e intelectual.` },
        { heading: 'FACULTADES', content: `- Solicitar registros de marcas, patentes y disenos\n- Presentar escritos, recursos y alegaciones\n- Recibir notificaciones oficiales\n- Realizar cuantos actos sean necesarios` },
        { content: `\nExpediente vinculado: ${ref}\n\n\nFirmado en _____________, a ___ de _____________ de 2025\n\n\n\nFdo.: _____________________________\n       [Nombre y cargo del firmante]` }
      ]
    }),
    
    filing_receipt: () => ({
      title: 'ACUSE DE RECIBO DE SOLICITUD',
      sections: [
        { heading: 'OFICINA', content: `[OEPM / EUIPO / EPO / INPI]` },
        { heading: 'DATOS DE LA SOLICITUD', content: `Numero de solicitud: [Numero oficial]\nFecha de presentacion: ${today}\nSolicitante: [Nombre empresa cliente]\nRepresentante: Meridian IP Consulting S.L.` },
        { heading: 'MARCA / PATENTE', content: `Denominacion: ${matterTitle}\nTipo: [Denominativa / Mixta / Figurativa]\nClases Nice: [Clases solicitadas]` },
        { heading: 'TASAS', content: `Tasa de solicitud: [Importe] EUR\nEstado: Pagada mediante transferencia` },
        { heading: 'PROXIMOS PASOS', content: `1. Examen formal: 1-2 meses\n2. Publicacion (si procede): 3-4 meses\n3. Periodo oposicion: 2-3 meses tras publicacion` }
      ]
    }),
    
    publication: () => ({
      title: 'PUBLICACION EN BOLETIN OFICIAL',
      sections: [
        { heading: 'DATOS DE PUBLICACION', content: `Boletin: [BOPI / Boletin EUIPO / Gaceta EPO]\nNumero: [numero de boletin]\nFecha: ${today}` },
        { heading: 'MARCA/PATENTE PUBLICADA', content: `Denominacion: ${matterTitle}\nReferencia: ${ref}\nNumero de solicitud: [numero oficial]\nClases/Reivindicaciones: [detalle]` },
        { heading: 'PERIODO DE OPOSICION', content: `Inicio: [fecha publicacion]\nFin: [fecha + 2/3 meses]\nDuracion: 2 meses (OEPM) / 3 meses (EUIPO)` },
        { content: `NOTA: Cualquier tercero interesado puede presentar oposicion\ndurante el periodo indicado mediante escrito motivado.` }
      ]
    }),
    
    certificate: () => ({
      title: 'CERTIFICADO DE REGISTRO',
      sections: [
        { content: `CERTIFICADO OFICIAL DE REGISTRO\n\n[Logotipo y sello de la oficina emisora]` },
        { content: `Se certifica que la marca/patente:\n\nDenominacion: ${matterTitle}\nNumero de registro: [numero oficial]\nTitular: [Nombre empresa]\nClases Nice / Reivindicaciones: [detalle]\n\nFecha de registro: [fecha]\nFecha de caducidad: [fecha + 10 anos]` },
        { content: `Este certificado acredita la concesion del derecho de propiedad\nindustrial conforme a la legislacion vigente.\n\n\n[Firma y sello oficial]` }
      ]
    }),
    
    technical: () => ({
      title: 'DOCUMENTACION TECNICA',
      sections: [
        { heading: 'TITULO', content: `${matterTitle}\nReferencia: ${ref}` },
        { heading: '1. CAMPO TECNICO', content: `La presente invencion/documento se refiere al campo de\n[campo tecnico especifico].` },
        { heading: '2. ANTECEDENTES', content: `[Descripcion del estado del arte actual]\n[Problemas existentes que la invencion resuelve]` },
        { heading: '3. DESCRIPCION', content: `[Descripcion detallada de la solucion tecnica propuesta]\n[Ventajas y mejoras respecto al estado del arte]` },
        { heading: '4. REIVINDICACIONES', content: `Reivindicacion 1: [descripcion principal]\nReivindicacion 2: [descripcion dependiente]\n[...]` }
      ]
    }),
    
    opposition: () => ({
      title: 'ESCRITO DE OPOSICION',
      sections: [
        { heading: 'A LA OFICINA', content: `[OEPM / EUIPO / EPO]` },
        { heading: 'OPONENTE', content: `[Nombre empresa titular de derechos anteriores]\nRepresentado por: Meridian IP Consulting S.L.` },
        { heading: 'MARCA/SOLICITUD OPUESTA', content: `Denominacion: [marca contra la que se opone]\nNumero de solicitud: [numero]\nSolicitante: [empresa solicitante contraria]` },
        { heading: 'FUNDAMENTOS', content: `1. Riesgo de confusion con marca anterior del oponente\n2. Similitud fonetica, visual y/o conceptual\n3. Identidad o similitud de productos/servicios` },
        { heading: 'PETICION', content: `Se solicita la DENEGACION total de la marca opuesta.\nSubsidiariamente, denegacion parcial en clases conflictivas.` }
      ]
    }),
    
    office_action: () => ({
      title: 'RESOLUCION / REQUERIMIENTO OFICIAL',
      sections: [
        { heading: 'OFICINA EMISORA', content: `[OEPM / EUIPO / EPO]` },
        { heading: 'EXPEDIENTE', content: `Referencia: ${ref}\nMarca/Patente: ${matterTitle}` },
        { heading: 'CONTENIDO', content: `[Descripcion del requerimiento o resolucion de la oficina]\n\n[Motivos y fundamentos legales citados]` },
        { heading: 'PLAZO DE RESPUESTA', content: `[Plazo concedido y fecha limite para responder]` }
      ]
    }),
    
    evidence: () => ({
      title: 'INFORME DE VIGILANCIA / ALERTA',
      sections: [
        { heading: 'TIPO DE ALERTA', content: `Deteccion de marca/solicitud potencialmente conflictiva` },
        { heading: 'MARCA DETECTADA', content: `Denominacion: [marca similar detectada]\nSolicitante/Titular: [empresa]\nClases Nice: [clases]\nOficina: [oficina donde se publico]` },
        { heading: 'ANALISIS DE SIMILITUD', content: `Similitud fonetica: [Alto/Medio/Bajo]\nSimilitud visual: [Alto/Medio/Bajo]\nSimilitud conceptual: [Alto/Medio/Bajo]` },
        { heading: 'RECOMENDACION', content: `[Accion recomendada: monitorizar / presentar oposicion / contactar]` }
      ]
    })
  };
  
  // Map category to template
  const categoryMap: Record<string, string> = {
    case_opening: 'case_opening',
    search_report: 'search_report',
    power_of_attorney: 'power_of_attorney',
    filing_receipt: 'filing_receipt',
    publication: 'publication',
    certificate: 'certificate',
    technical: 'technical',
    opposition: 'opposition',
    office_action: 'office_action',
    evidence: 'evidence',
    internal: 'technical',
    generated: 'search_report',
    received: 'filing_receipt',
    uploaded: 'case_opening'
  };
  
  const templateKey = categoryMap[category] || categoryMap[doc.document_type] || 'case_opening';
  const generator = templates[templateKey] || templates.case_opening;
  return generator();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Get all documents for demo org
    const { data: docs, error } = await supabase
      .from('matter_documents')
      .select('*, matters(reference, title)')
      .eq('organization_id', ORG_ID);
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const results: any[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (const doc of docs || []) {
      try {
        const { title, sections } = getDocContent(doc);
        const footer = `Meridian IP Consulting S.L. - IP-NEXUS - ${today} - Ref: ${doc.matters?.reference || 'N/A'}`;
        
        const pdfBytes = createPDF(title, sections, footer);
        
        // Create proper storage path
        const fileName = doc.file_name || `${doc.id}.pdf`;
        const storagePath = `${ORG_ID}/${doc.matter_id}/${fileName}`;
        
        // Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          results.push({ id: doc.id, name: doc.name, error: uploadError.message });
          continue;
        }
        
        // Update document record with correct paths
        await supabase
          .from('matter_documents')
          .update({ 
            file_path: storagePath,
            storage_path: storagePath,
            file_size: pdfBytes.length,
            mime_type: 'application/pdf'
          })
          .eq('id', doc.id);
        
        results.push({ id: doc.id, name: doc.name, status: 'ok', size: pdfBytes.length, path: storagePath });
        
      } catch (err) {
        results.push({ id: doc.id, name: doc.name, error: String(err) });
      }
    }
    
    const successCount = results.filter(r => r.status === 'ok').length;
    
    return new Response(JSON.stringify({ 
      total: docs?.length || 0, 
      success: successCount,
      failed: (docs?.length || 0) - successCount,
      results 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
