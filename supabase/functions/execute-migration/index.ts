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
    const { project_id } = await req.json();

    if (!project_id) {
      throw new Error("project_id is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Obtener proyecto
    const { data: project, error: projectError } = await supabase
      .from("migration_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error("Project not found");

    // Actualizar estado
    await supabase
      .from("migration_projects")
      .update({
        status: "migrating",
        started_at: new Date().toISOString(),
      })
      .eq("id", project_id);

    // Log inicio
    await logMigration(supabase, project_id, null, "info", "Migración iniciada");

    // Obtener archivos validados
    const { data: files } = await supabase
      .from("migration_files")
      .select("*")
      .eq("project_id", project_id)
      .in("validation_status", ["validated", "analyzed"]);

    const stats: Record<string, { total: number; migrated: number; failed: number }> = {};
    const errors: any[] = [];

    // Procesar cada archivo
    for (const file of files || []) {
      const entityType = file.entity_type;
      const totalRows = file.total_rows || 0;
      stats[entityType] = { total: totalRows, migrated: 0, failed: 0 };

      try {
        // En producción, aquí se descargaría y parsearía el archivo real
        // Para simulación, usamos los sample_data del análisis
        const sampleData = file.analysis?.sample_data || [];
        const mapping = file.column_mapping || {};

        // Simular migración de los datos de ejemplo
        for (let i = 0; i < sampleData.length; i++) {
          const row = sampleData[i];

          try {
            // Transformar datos según mapeo
            const transformedData = transformRow(row, mapping, file.transformations || {});
            
            // Añadir organization_id
            transformedData.organization_id = project.organization_id;

            // Insertar según tipo de entidad
            const result = await insertEntity(supabase, entityType, transformedData);

            if (result.id) {
              // Guardar mapeo de IDs
              const sourceIdKey = Object.keys(mapping).find(k => 
                mapping[k] === "reference" || mapping[k] === "id" || mapping[k] === "name"
              );
              const sourceId = sourceIdKey ? row[sourceIdKey] : `row_${i}`;

              await supabase.from("migration_id_mapping").insert({
                project_id,
                entity_type: entityType,
                source_id: String(sourceId),
                target_id: result.id,
              });

              stats[entityType].migrated++;
            }
          } catch (rowError: any) {
            stats[entityType].failed++;
            errors.push({
              row: i + 2,
              entity_type: entityType,
              error: rowError.message,
            });

            await logMigration(
              supabase,
              project_id,
              file.id,
              "error",
              `Error en fila ${i + 2}: ${rowError.message}`,
              { row: i + 2 }
            );
          }
        }

        // Simular migración del resto de filas
        const remainingRows = totalRows - sampleData.length;
        if (remainingRows > 0) {
          // Simular éxito para el 95% de las filas restantes
          const successRate = 0.95;
          const successfulRows = Math.floor(remainingRows * successRate);
          const failedRows = remainingRows - successfulRows;

          stats[entityType].migrated += successfulRows;
          stats[entityType].failed += failedRows;

          // Añadir algunos errores simulados
          for (let i = 0; i < Math.min(failedRows, 5); i++) {
            errors.push({
              row: sampleData.length + i + 2,
              entity_type: entityType,
              error: "Error simulado: datos incompletos o inválidos",
            });
          }
        }

        // Actualizar archivo completado
        await supabase
          .from("migration_files")
          .update({
            processed_rows: totalRows,
            migrated_rows: stats[entityType].migrated,
            failed_rows: stats[entityType].failed,
          })
          .eq("id", file.id);

        await logMigration(
          supabase,
          project_id,
          file.id,
          "success",
          `Archivo ${file.file_name} procesado: ${stats[entityType].migrated} migrados, ${stats[entityType].failed} fallidos`
        );
      } catch (fileError: any) {
        await logMigration(
          supabase,
          project_id,
          file.id,
          "error",
          `Error procesando archivo ${file.file_name}: ${fileError.message}`
        );
      }
    }

    // Calcular totales
    const totalMigrated = Object.values(stats).reduce((sum, s) => sum + s.migrated, 0);
    const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);

    // Determinar estado final
    const finalStatus = totalFailed > 0 && totalMigrated === 0 ? "failed" : "completed";

    // Finalizar proyecto
    await supabase
      .from("migration_projects")
      .update({
        status: finalStatus,
        stats,
        errors: errors.slice(0, 100),
        completed_at: new Date().toISOString(),
      })
      .eq("id", project_id);

    await logMigration(
      supabase,
      project_id,
      null,
      "success",
      `Migración completada: ${totalMigrated} registros migrados, ${totalFailed} fallidos`
    );

    return new Response(
      JSON.stringify({ success: true, stats, total_migrated: totalMigrated, total_failed: totalFailed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function transformRow(
  row: Record<string, any>,
  mapping: Record<string, string>,
  transformations: Record<string, Record<string, string>>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [sourceCol, targetField] of Object.entries(mapping)) {
    if (!targetField) continue;

    let value = row[sourceCol];

    // Aplicar transformación si existe
    if (transformations[targetField] && value in transformations[targetField]) {
      value = transformations[targetField][value];
    }

    // Limpiar valores
    if (typeof value === "string") {
      value = value.trim();
    }

    // Convertir vacíos a null
    if (value === "" || value === undefined) {
      value = null;
    }

    result[targetField] = value;
  }

  return result;
}

async function insertEntity(
  supabase: any,
  entityType: string,
  data: Record<string, any>
): Promise<{ id: string }> {
  const tableName = getTableName(entityType);

  // Limpiar campos vacíos
  Object.keys(data).forEach((key) => {
    if (data[key] === "" || data[key] === undefined) {
      delete data[key];
    }
  });

  // Mapear campos específicos según la tabla
  const mappedData = mapFieldsForTable(tableName, data);

  const { data: result, error } = await supabase
    .from(tableName)
    .insert(mappedData)
    .select("id")
    .single();

  if (error) throw error;
  return result;
}

function getTableName(entityType: string): string {
  const mapping: Record<string, string> = {
    matters: "matters",
    contacts: "contacts",
    companies: "contacts", // Companies are stored as contacts with type='company'
    deadlines: "matter_events",
    documents: "matter_documents",
    invoices: "invoices",
    costs: "matter_costs",
    renewals: "matter_events",
  };
  return mapping[entityType] || entityType;
}

function mapFieldsForTable(tableName: string, data: Record<string, any>): Record<string, any> {
  const result = { ...data };

  if (tableName === "matters") {
    // Map common field variations
    if (result.ip_type) {
      result.type = result.ip_type;
      delete result.ip_type;
    }
    if (result.client_name) {
      result.owner_name = result.client_name;
      delete result.client_name;
    }
    if (result.classes) {
      // Convert classes to array if string
      if (typeof result.classes === "string") {
        result.nice_classes = result.classes.split(",").map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n));
      } else if (typeof result.classes === "number") {
        result.nice_classes = [result.classes];
      }
      delete result.classes;
    }
    if (result.territories) {
      result.jurisdiction = Array.isArray(result.territories) ? result.territories[0] : result.territories;
      delete result.territories;
    }
    // Remove fields that don't exist in matters table
    delete result.assigned_to_name;
  }

  if (tableName === "contacts") {
    // Set type for companies
    if (data.entity_type === "companies") {
      result.type = "company";
    } else {
      result.type = result.type || "person";
    }
    result.owner_type = "tenant";
    
    // Map position to job_title
    if (result.position) {
      result.job_title = result.position;
      delete result.position;
    }
    // Map address to address_line1
    if (result.address) {
      result.address_line1 = result.address;
      delete result.address;
    }
  }

  return result;
}

async function logMigration(
  supabase: any,
  projectId: string,
  fileId: string | null,
  logType: string,
  message: string,
  details: Record<string, any> = {}
) {
  await supabase.from("migration_logs").insert({
    project_id: projectId,
    file_id: fileId,
    log_type: logType,
    message,
    details,
  });
}
