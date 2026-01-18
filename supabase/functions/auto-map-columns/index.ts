import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceColumns, targetFields, sampleData } = await req.json();

    if (!sourceColumns || !targetFields) {
      throw new Error("sourceColumns and targetFields are required");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Si hay API key, usar OpenAI; si no, usar mapeo heurístico
    let mapping: Record<string, string> = {};
    let confidence: Record<string, number> = {};
    let suggestions: string[] = [];

    if (openaiApiKey) {
      // Llamar a OpenAI para mapeo inteligente
      const prompt = `Eres un experto en migración de datos de sistemas de gestión de Propiedad Intelectual.

Necesito mapear columnas de un archivo de origen a campos de destino.

COLUMNAS DE ORIGEN:
${sourceColumns.join('\n')}

CAMPOS DE DESTINO DISPONIBLES:
${targetFields.join('\n')}

DATOS DE EJEMPLO (primeras 3 filas):
${JSON.stringify(sampleData?.slice(0, 3) || [], null, 2)}

Devuelve un JSON con:
1. "mapping": objeto donde cada clave es una columna origen y el valor es el campo destino más apropiado (o null si no hay match)
2. "confidence": objeto con el nivel de confianza (0-100) para cada mapeo
3. "suggestions": array de sugerencias o advertencias sobre el mapeo

Considera:
- Nombres similares en español e inglés
- Abreviaciones comunes (TM=trademark, PAT=patent)
- El contenido de los datos de ejemplo
- Campos requeridos vs opcionales

Responde SOLO con el JSON, sin explicaciones adicionales.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: "Eres un asistente de migración de datos. Responde solo con JSON válido." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content || "{}");
        mapping = result.mapping || {};
        confidence = result.confidence || {};
        suggestions = result.suggestions || [];
      } else {
        // Fallback a mapeo heurístico si falla OpenAI
        ({ mapping, confidence, suggestions } = performHeuristicMapping(sourceColumns, targetFields));
      }
    } else {
      // Mapeo heurístico sin AI
      ({ mapping, confidence, suggestions } = performHeuristicMapping(sourceColumns, targetFields));
    }

    return new Response(
      JSON.stringify({ mapping, confidence, suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in auto-map:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function performHeuristicMapping(sourceColumns: string[], targetFields: string[]): {
  mapping: Record<string, string>;
  confidence: Record<string, number>;
  suggestions: string[];
} {
  const mapping: Record<string, string> = {};
  const confidence: Record<string, number> = {};
  const suggestions: string[] = [];

  // Mapeos comunes
  const commonMappings: Record<string, string[]> = {
    reference: ["reference", "ref", "referencia", "case ref", "case reference", "application number", "numero"],
    title: ["title", "titulo", "name", "nombre", "matter title", "case name", "mark name"],
    type: ["type", "tipo", "ip type", "matter type", "ip right type"],
    status: ["status", "estado", "legal status", "current status"],
    filing_date: ["filing date", "fecha solicitud", "file date", "application date"],
    registration_date: ["registration date", "fecha registro", "grant date"],
    expiry_date: ["expiry date", "fecha vencimiento", "expiration date", "renewal date", "next renewal"],
    nice_classes: ["classes", "clases", "nice classes", "nice classification", "class list"],
    jurisdiction: ["countries", "paises", "territories", "country", "jurisdiction", "designated countries", "country list"],
    owner_name: ["client", "cliente", "applicant", "owner", "titular"],
    name: ["name", "nombre", "full name", "contact name"],
    email: ["email", "correo", "e-mail", "mail"],
    phone: ["phone", "telefono", "tel", "telephone"],
    company_name: ["company", "empresa", "organization", "company name"],
    job_title: ["position", "cargo", "title", "job title"],
    address_line1: ["address", "direccion", "street"],
    city: ["city", "ciudad"],
    country: ["country", "pais"],
    notes: ["notes", "notas", "comments", "observations"],
  };

  sourceColumns.forEach((sourceCol) => {
    const normalizedSource = sourceCol.toLowerCase().trim();
    let bestMatch: string | null = null;
    let bestScore = 0;

    targetFields.forEach((targetField) => {
      const possibleNames = commonMappings[targetField] || [targetField];
      
      for (const possibleName of possibleNames) {
        const normalizedPossible = possibleName.toLowerCase();
        
        // Coincidencia exacta
        if (normalizedSource === normalizedPossible) {
          bestMatch = targetField;
          bestScore = 100;
          break;
        }
        
        // Contiene el nombre
        if (normalizedSource.includes(normalizedPossible) || normalizedPossible.includes(normalizedSource)) {
          const score = 80;
          if (score > bestScore) {
            bestMatch = targetField;
            bestScore = score;
          }
        }
        
        // Palabras similares
        const sourceWords = normalizedSource.split(/[\s_-]+/);
        const targetWords = normalizedPossible.split(/[\s_-]+/);
        const commonWords = sourceWords.filter(w => targetWords.includes(w));
        if (commonWords.length > 0) {
          const score = (commonWords.length / Math.max(sourceWords.length, targetWords.length)) * 70;
          if (score > bestScore) {
            bestMatch = targetField;
            bestScore = score;
          }
        }
      }
    });

    if (bestMatch && bestScore >= 50) {
      mapping[sourceCol] = bestMatch;
      confidence[sourceCol] = bestScore;
    } else {
      mapping[sourceCol] = "";
      confidence[sourceCol] = 0;
    }
  });

  // Generar sugerencias
  const unmapped = sourceColumns.filter(col => !mapping[col]);
  if (unmapped.length > 0) {
    suggestions.push(`${unmapped.length} columnas no pudieron ser mapeadas automáticamente: ${unmapped.slice(0, 3).join(", ")}${unmapped.length > 3 ? "..." : ""}`);
  }

  const lowConfidence = sourceColumns.filter(col => mapping[col] && confidence[col] < 80);
  if (lowConfidence.length > 0) {
    suggestions.push(`${lowConfidence.length} mapeos tienen baja confianza. Revísalos manualmente.`);
  }

  const requiredFields = ["reference", "title", "name"];
  const missingRequired = requiredFields.filter(f => 
    !Object.values(mapping).includes(f)
  );
  if (missingRequired.length > 0) {
    suggestions.push(`Campos requeridos sin mapear: ${missingRequired.join(", ")}`);
  }

  return { mapping, confidence, suggestions };
}
