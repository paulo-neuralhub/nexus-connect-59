import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Patrones conocidos de sistemas de PI
const SYSTEM_PATTERNS: Record<string, { columns: string[]; indicators: string[] }> = {
  patsnap: {
    columns: ['patent_number', 'publication_number', 'applicant', 'ipc_code', 'patent_family'],
    indicators: ['patsnap', 'innovation', 'patent family', 'cited by', 'citing']
  },
  anaqua: {
    columns: ['matter_number', 'matter_title', 'docket_number', 'aq_', 'anaqua'],
    indicators: ['anaqua', 'matter', 'docket', 'party', 'aq_']
  },
  cpa_global: {
    columns: ['case_reference', 'renewal_date', 'official_fee', 'service_fee', 'annuity'],
    indicators: ['cpa', 'renewal', 'annuity', 'maintenance fee']
  },
  ipan: {
    columns: ['numexpediente', 'titulo', 'fechasolicitud', 'numregistro', 'tipopi'],
    indicators: ['expediente', 'solicitud', 'registro', 'clase niza']
  },
  dennemeyer: {
    columns: ['case_ref', 'ip_right', 'renewal_due', 'dennemeyer'],
    indicators: ['dennemeyer', 'ip right', 'renewal']
  },
  generic_excel: {
    columns: ['reference', 'title', 'status', 'filing_date', 'application'],
    indicators: []
  }
};

// Schema de IP-NEXUS para mapeo
const IP_NEXUS_SCHEMA: Record<string, { fields: Array<{ name: string; type: string; aliases: string[] }> }> = {
  matters: {
    fields: [
      { name: 'reference', type: 'string', aliases: ['ref', 'case_ref', 'matter_number', 'numexpediente', 'expediente', 'case_reference'] },
      { name: 'title', type: 'string', aliases: ['titulo', 'name', 'matter_title', 'designation', 'description'] },
      { name: 'ip_type', type: 'enum', aliases: ['type', 'tipopi', 'ip_right', 'category', 'matter_type'] },
      { name: 'status', type: 'enum', aliases: ['estado', 'state', 'matter_status', 'current_status'] },
      { name: 'filing_date', type: 'date', aliases: ['fechasolicitud', 'application_date', 'filed', 'fecha_solicitud'] },
      { name: 'grant_date', type: 'date', aliases: ['fechaconcesion', 'registration_date', 'granted', 'issue_date'] },
      { name: 'expiry_date', type: 'date', aliases: ['fechaexpiracion', 'expiration', 'expires', 'validity_date'] },
      { name: 'application_number', type: 'string', aliases: ['numsolicitud', 'app_no', 'application_no', 'filing_number'] },
      { name: 'registration_number', type: 'string', aliases: ['numregistro', 'reg_no', 'registration_no', 'patent_number'] },
      { name: 'country_code', type: 'string', aliases: ['pais', 'country', 'jurisdiction', 'territory'] },
      { name: 'classes', type: 'array', aliases: ['clase', 'nice_class', 'ipc', 'classification'] }
    ]
  },
  contacts: {
    fields: [
      { name: 'name', type: 'string', aliases: ['nombre', 'contact_name', 'full_name', 'party_name'] },
      { name: 'email', type: 'email', aliases: ['correo', 'email_address', 'e_mail'] },
      { name: 'phone', type: 'string', aliases: ['telefono', 'telephone', 'tel', 'contact_phone'] },
      { name: 'company', type: 'string', aliases: ['empresa', 'organization', 'entity', 'firm'] },
      { name: 'role', type: 'enum', aliases: ['rol', 'type', 'party_type', 'contact_type'] },
      { name: 'address', type: 'text', aliases: ['direccion', 'addr', 'street'] },
      { name: 'country', type: 'string', aliases: ['pais', 'nation'] }
    ]
  },
  deadlines: {
    fields: [
      { name: 'title', type: 'string', aliases: ['descripcion', 'description', 'event', 'action'] },
      { name: 'due_date', type: 'date', aliases: ['fecha', 'deadline', 'due', 'fecha_limite'] },
      { name: 'deadline_type', type: 'enum', aliases: ['tipo', 'type', 'category'] },
      { name: 'priority', type: 'enum', aliases: ['prioridad', 'importance', 'urgency'] },
      { name: 'status', type: 'enum', aliases: ['estado', 'state', 'completed'] }
    ]
  },
  costs: {
    fields: [
      { name: 'description', type: 'string', aliases: ['concepto', 'item', 'fee_type'] },
      { name: 'amount', type: 'decimal', aliases: ['importe', 'fee', 'cost', 'price', 'valor'] },
      { name: 'currency', type: 'string', aliases: ['moneda', 'curr'] },
      { name: 'cost_type', type: 'enum', aliases: ['tipo', 'type', 'category'] },
      { name: 'date', type: 'date', aliases: ['fecha', 'invoice_date', 'payment_date'] },
      { name: 'invoice_number', type: 'string', aliases: ['factura', 'invoice_no', 'bill_no'] }
    ]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { fileId, fileType, options } = await req.json();

    // Get file info
    const { data: fileInfo, error: fileError } = await supabase
      .from('import_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    // Update status to analyzing
    await supabase
      .from('import_files')
      .update({ analysis_status: 'analyzing' })
      .eq('id', fileId);

    // Get file content from storage
    const { data: fileContent, error: downloadError } = await supabase.storage
      .from('import-files')
      .download(fileInfo.storage_path);

    if (downloadError) throw downloadError;

    let analysisResult: any;
    const detectedType = fileType || detectFileType(fileInfo.mime_type, fileInfo.original_filename);

    switch (detectedType) {
      case 'spreadsheet':
        analysisResult = await analyzeSpreadsheet(fileContent, options);
        break;
      case 'pdf':
        analysisResult = await analyzePdf(fileContent, options);
        break;
      case 'xml':
        analysisResult = await analyzeXml(fileContent, options);
        break;
      case 'json':
        analysisResult = await analyzeJson(fileContent, options);
        break;
      default:
        analysisResult = {
          type: 'unknown',
          dataQuality: { score: 0, completeness: 0, consistency: 0, issues: [] },
          estimatedImportTime: 0
        };
    }

    // Generate suggested mapping
    const suggestedMapping = generateMapping(analysisResult);
    analysisResult.suggestedMapping = suggestedMapping;

    // Update file with analysis
    await supabase
      .from('import_files')
      .update({
        analysis_status: 'completed',
        analysis_result: analysisResult,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', fileId);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function detectFileType(mimeType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || 
      ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return 'spreadsheet';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (mimeType === 'application/xml' || mimeType === 'text/xml' || ext === 'xml') {
    return 'xml';
  }
  if (mimeType === 'application/json' || ext === 'json') {
    return 'json';
  }
  return 'unknown';
}

async function analyzeSpreadsheet(fileContent: Blob, options: any) {
  // Use SheetJS for parsing
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
  
  const arrayBuffer = await fileContent.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  
  const sheets: any[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) continue;
    
    // Detect header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i] as any[];
      const nonEmptyCount = row?.filter(cell => cell !== null && cell !== undefined && cell !== '').length || 0;
      if (nonEmptyCount > 3) {
        headerRow = i;
        break;
      }
    }
    
    const headerData = jsonData[headerRow] as any[];
    const headers = (headerData || []).map((h, i) => 
      h?.toString().trim() || `Column_${i + 1}`
    );
    
    const dataRows = jsonData.slice(headerRow + 1) as any[][];
    const sampleData = dataRows.slice(0, options?.sampleRows || 10).map((row: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, i) => {
        obj[header] = row?.[i];
      });
      return obj;
    });
    
    // Analyze columns
    const columns = headers.map((header, index) => {
      const values = dataRows.map((row: any[]) => row?.[index]).filter((v: any) => v != null && v !== '');
      
      return {
        name: header,
        originalName: header,
        index,
        dataType: detectDataType(values),
        nullCount: dataRows.length - values.length,
        uniqueCount: new Set(values.map(String)).size,
        sampleValues: values.slice(0, 5).map(String),
        issues: detectColumnIssues(header, values)
      };
    });
    
    // Detect entity
    const entityDetection = detectEntity(headers, sampleData);
    
    // Determine data types for each column
    const dataTypes: Record<string, string> = {};
    columns.forEach(col => {
      dataTypes[col.name] = col.dataType;
    });
    
    sheets.push({
      name: sheetName,
      rows: dataRows.length,
      columns: headers,
      detectedEntity: entityDetection.entity,
      confidence: entityDetection.confidence,
      sampleData,
      dataTypes,
      headerRow,
      dataStartRow: headerRow + 1,
      emptyRows: dataRows.filter((row: any[]) => row?.every((cell: any) => !cell)).length,
      duplicateRows: dataRows.length - new Set(dataRows.map((row: any[]) => JSON.stringify(row))).size,
      columnDetails: columns
    });
  }
  
  // Detect source system
  const allColumns = sheets.flatMap(s => s.columns.map((c: string) => c.toLowerCase()));
  const detectedSystem = detectSourceSystem(allColumns);
  
  // Calculate data quality
  const dataQuality = calculateDataQuality(sheets);
  
  return {
    type: 'spreadsheet',
    sheets,
    detectedSystem,
    dataQuality,
    estimatedImportTime: Math.ceil(sheets.reduce((acc, s) => acc + s.rows, 0) / 100)
  };
}

async function analyzePdf(fileContent: Blob, options: any) {
  // Basic PDF analysis (production would use pdf-parse or similar)
  const buffer = await fileContent.arrayBuffer();
  
  return {
    type: 'pdf',
    pages: 1, // Placeholder - would use actual PDF parsing
    hasText: true,
    hasImages: false,
    ocrRequired: false,
    detectedDocuments: [],
    dataQuality: { score: 80, completeness: 0.8, consistency: 0.9, issues: [] },
    estimatedImportTime: 5
  };
}

async function analyzeXml(fileContent: Blob, options: any) {
  const text = await fileContent.text();
  
  const rootMatch = text.match(/<(\w+)/);
  const rootElement = rootMatch ? rootMatch[1] : 'unknown';
  
  let schemaDetected;
  if (text.includes('ST96') || text.includes('st96')) {
    schemaDetected = 'WIPO_ST96';
  } else if (text.includes('ST36') || text.includes('st36')) {
    schemaDetected = 'WIPO_ST36';
  } else if (text.includes('ops.epo.org')) {
    schemaDetected = 'EPO_OPS';
  }
  
  const records = (text.match(/<patent|<trademark|<matter|<case/gi) || []).length;
  
  return {
    type: 'xml',
    rootElement,
    schemaDetected,
    records,
    dataQuality: { score: 90, completeness: 0.95, consistency: 0.95, issues: [] },
    estimatedImportTime: 5
  };
}

async function analyzeJson(fileContent: Blob, options: any) {
  const text = await fileContent.text();
  
  try {
    const data = JSON.parse(text);
    const isArray = Array.isArray(data);
    const records = isArray ? data : (data.records || data.items || data.data || [data]);
    
    return {
      type: 'json',
      isArray,
      records: records.length,
      sampleData: records.slice(0, 5),
      dataQuality: { score: 95, completeness: 0.98, consistency: 0.98, issues: [] },
      estimatedImportTime: Math.ceil(records.length / 100)
    };
  } catch (e) {
    return {
      type: 'json',
      dataQuality: { score: 0, completeness: 0, consistency: 0, issues: [{ 
        severity: 'error', 
        type: 'invalid_format', 
        message: 'Invalid JSON format' 
      }] },
      estimatedImportTime: 0
    };
  }
}

function detectDataType(values: any[]): string {
  if (values.length === 0) return 'empty';
  
  const types = values.map(v => {
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    const str = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}\/\d{2}\/\d{4}/.test(str)) return 'date';
    if (/^-?\d+\.?\d*$/.test(str) && !isNaN(parseFloat(str))) return 'number';
    return 'string';
  });
  
  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length === 1) return uniqueTypes[0];
  if (uniqueTypes.length === 2 && uniqueTypes.includes('string')) {
    return uniqueTypes.find(t => t !== 'string') || 'mixed';
  }
  return 'mixed';
}

function detectColumnIssues(header: string, values: any[]): string[] {
  const issues: string[] = [];
  
  const totalCount = values.length || 1;
  const nullRatio = 1 - (values.length / totalCount);
  if (nullRatio > 0.5) {
    issues.push(`Alta cantidad de valores vacíos (${Math.round(nullRatio * 100)}%)`);
  }
  
  const hasEncodingIssues = values.some(v => 
    String(v).includes('�') || String(v).includes('Ã')
  );
  if (hasEncodingIssues) {
    issues.push('Posibles problemas de codificación de caracteres');
  }
  
  return issues;
}

function detectEntity(headers: string[], sampleData: any[]): { entity: string; confidence: number } {
  const headerLower = headers.map(h => h.toLowerCase());
  
  const scores: Record<string, number> = {
    matters: 0,
    contacts: 0,
    deadlines: 0,
    costs: 0
  };
  
  // Matters indicators
  const matterKeywords = ['reference', 'ref', 'patent', 'trademark', 'expediente', 'case', 'matter', 'application', 'registration'];
  matterKeywords.forEach(kw => {
    if (headerLower.some(h => h.includes(kw))) scores.matters += 2;
  });
  
  // Contacts indicators
  const contactKeywords = ['name', 'email', 'phone', 'company', 'address', 'contact', 'client', 'party'];
  contactKeywords.forEach(kw => {
    if (headerLower.some(h => h.includes(kw))) scores.contacts += 2;
  });
  
  // Deadlines indicators
  const deadlineKeywords = ['deadline', 'due', 'plazo', 'fecha', 'reminder', 'action', 'event'];
  deadlineKeywords.forEach(kw => {
    if (headerLower.some(h => h.includes(kw))) scores.deadlines += 2;
  });
  
  // Costs indicators
  const costKeywords = ['cost', 'fee', 'amount', 'price', 'invoice', 'payment', 'importe', 'coste'];
  costKeywords.forEach(kw => {
    if (headerLower.some(h => h.includes(kw))) scores.costs += 2;
  });
  
  const maxScore = Math.max(...Object.values(scores));
  const entity = Object.entries(scores).find(([_, s]) => s === maxScore)?.[0] || 'matters';
  const confidence = maxScore > 0 ? Math.min(maxScore / 10, 1) : 0.5;
  
  return { entity, confidence };
}

function detectSourceSystem(columns: string[]): { systemId: string; systemName: string; confidence: number; indicators: string[] } | undefined {
  for (const [systemId, patterns] of Object.entries(SYSTEM_PATTERNS)) {
    const matchedColumns = patterns.columns.filter(pc => 
      columns.some(c => c.includes(pc))
    );
    
    if (matchedColumns.length >= 2) {
      const systemNames: Record<string, string> = {
        patsnap: 'PatSnap',
        anaqua: 'Anaqua',
        cpa_global: 'CPA Global',
        ipan: 'IPAN',
        dennemeyer: 'Dennemeyer',
        generic_excel: 'Excel Genérico'
      };
      
      return {
        systemId,
        systemName: systemNames[systemId] || systemId,
        confidence: matchedColumns.length / patterns.columns.length,
        indicators: matchedColumns
      };
    }
  }
  
  return undefined;
}

function calculateDataQuality(sheets: any[]): { score: number; completeness: number; consistency: number; issues: any[] } {
  const issues: any[] = [];
  let totalCompleteness = 0;
  let totalConsistency = 0;
  
  sheets.forEach(sheet => {
    const totalCells = sheet.rows * sheet.columns.length;
    const columnDetails = sheet.columnDetails || [];
    const nullCells = columnDetails.reduce((acc: number, col: any) => acc + (col.nullCount || 0), 0);
    totalCompleteness += totalCells > 0 ? (totalCells - nullCells) / totalCells : 1;
    
    const mixedTypeColumns = columnDetails.filter((col: any) => col.dataType === 'mixed');
    totalConsistency += 1 - (mixedTypeColumns.length / (columnDetails.length || 1));
    
    if (sheet.emptyRows > 0) {
      issues.push({
        severity: 'warning',
        type: 'missing_data',
        message: `${sheet.emptyRows} filas vacías en hoja "${sheet.name}"`,
        affectedRows: sheet.emptyRows
      });
    }
    
    if (sheet.duplicateRows > 0) {
      issues.push({
        severity: 'warning',
        type: 'duplicate',
        message: `${sheet.duplicateRows} filas duplicadas en hoja "${sheet.name}"`,
        affectedRows: sheet.duplicateRows
      });
    }
  });
  
  const sheetCount = sheets.length || 1;
  const completeness = totalCompleteness / sheetCount;
  const consistency = totalConsistency / sheetCount;
  const score = Math.round((completeness * 0.6 + consistency * 0.4) * 100);
  
  return { score, completeness, consistency, issues };
}

function generateMapping(analysisResult: any): Record<string, any> {
  const sheets = analysisResult.sheets || [];
  if (sheets.length === 0) return {};

  const mappings: Record<string, any> = {};

  for (const sheet of sheets) {
    const entity = sheet.detectedEntity;
    const entitySchema = IP_NEXUS_SCHEMA[entity];
    
    if (!entitySchema) continue;

    const columns = sheet.columns || [];
    for (const column of columns) {
      const colNameLower = column.toLowerCase().replace(/[_\s-]/g, '');
      
      for (const field of entitySchema.fields) {
        const allNames = [field.name, ...field.aliases].map(n => n.toLowerCase().replace(/[_\s-]/g, ''));
        
        if (allNames.some(alias => colNameLower.includes(alias) || alias.includes(colNameLower))) {
          mappings[column] = {
            sourceField: column,
            targetEntity: entity,
            targetField: field.name,
            confidence: 0.85,
            reasoning: `Nombre de columna "${column}" coincide con alias de campo "${field.name}"`,
            alternatives: []
          };
          break;
        }
      }
    }
  }

  return mappings;
}
