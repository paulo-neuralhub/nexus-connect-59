import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_id } = await req.json();

    if (!file_id) {
      throw new Error("file_id is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Obtener archivo
    const { data: file, error: fileError } = await supabase
      .from("migration_files")
      .select("*")
      .eq("id", file_id)
      .single();

    if (fileError) throw fileError;
    if (!file) throw new Error("File not found");

    const errors: any[] = [];
    const warnings: any[] = [];
    const mapping = file.column_mapping || {};
    const analysis = file.analysis || {};

    // Validar que hay mapeo
    const mappedFields = Object.values(mapping).filter(v => v);
    if (mappedFields.length === 0) {
      errors.push({
        column: "_general",
        error: "No hay campos mapeados",
        row: 0,
        value: "",
      });
    }

    // Validar campos requeridos según tipo de entidad
    const requiredFields = getRequiredFields(file.entity_type);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    
    missingRequired.forEach(field => {
      errors.push({
        column: field,
        error: `Campo requerido '${field}' no está mapeado`,
        row: 0,
        value: "",
      });
    });

    // Validar datos de ejemplo
    const sampleData = analysis.sample_data || [];
    sampleData.forEach((row: any, index: number) => {
      Object.entries(mapping).forEach(([sourceCol, targetField]) => {
        if (!targetField) return;
        
        const value = row[sourceCol];
        
        // Validar valores vacíos en campos requeridos
        if (requiredFields.includes(targetField as string) && (!value || value === "")) {
          errors.push({
            column: sourceCol,
            error: `Valor vacío en campo requerido`,
            row: index + 2,
            value: String(value || ""),
          });
        }

        // Validar formatos
        if (targetField === "email" && value) {
          if (!isValidEmail(String(value))) {
            warnings.push({
              column: sourceCol,
              warning: `Email posiblemente inválido: ${value}`,
              row: index + 2,
            });
          }
        }

        if ((targetField as string).includes("date") && value) {
          if (!isValidDate(value)) {
            warnings.push({
              column: sourceCol,
              warning: `Formato de fecha no reconocido: ${value}`,
              row: index + 2,
              suggestion: "Use formato YYYY-MM-DD o DD/MM/YYYY",
            });
          }
        }
      });
    });

    // Generar advertencias generales
    const nullCounts = analysis.null_counts || {};
    Object.entries(nullCounts).forEach(([col, count]) => {
      const totalRows = analysis.total_rows || 1;
      const nullPercentage = ((count as number) / totalRows) * 100;
      if (nullPercentage > 20) {
        warnings.push({
          column: col,
          warning: `${nullPercentage.toFixed(1)}% de valores vacíos`,
          suggestion: "Revise si este campo debe mapearse o si los datos están incompletos",
        });
      }
    });

    // Determinar estado de validación
    const validationStatus = errors.length > 0 ? "has_errors" : "validated";

    // Actualizar archivo
    await supabase
      .from("migration_files")
      .update({
        validation_status: validationStatus,
        validation_errors: errors,
        validation_warnings: warnings,
      })
      .eq("id", file_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: validationStatus,
        errors,
        warnings,
        error_count: errors.length,
        warning_count: warnings.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error validating file:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function getRequiredFields(entityType: string): string[] {
  switch (entityType) {
    case "matters":
      return ["reference", "title"];
    case "contacts":
      return ["name"];
    case "companies":
      return ["name"];
    default:
      return [];
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(value: any): boolean {
  // Check common date formats
  if (typeof value === "number") {
    // Excel serial date
    return value > 25569 && value < 60000;
  }
  
  if (typeof value === "string") {
    const patterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,         // DD/MM/YYYY or MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
    ];
    
    return patterns.some(p => p.test(value)) || !isNaN(Date.parse(value));
  }
  
  return false;
}
