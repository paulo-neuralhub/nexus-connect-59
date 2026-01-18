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

    // Actualizar estado
    await supabase
      .from("migration_files")
      .update({ validation_status: "analyzing" })
      .eq("id", file_id);

    // Simular análisis (en producción, descargar y parsear el archivo real)
    // Para ahora, generamos datos de ejemplo basados en el tipo de entidad
    const columns = getColumnsForEntityType(file.entity_type);
    const sampleData = generateSampleData(columns, 5);
    const totalRows = Math.floor(Math.random() * 500) + 100;

    const detectedTypes: Record<string, string> = {};
    const nullCounts: Record<string, number> = {};
    const uniqueCounts: Record<string, number> = {};

    columns.forEach((col) => {
      detectedTypes[col] = getTypeForColumn(col);
      nullCounts[col] = Math.floor(Math.random() * 10);
      uniqueCounts[col] = Math.floor(Math.random() * totalRows * 0.8) + 10;
    });

    // Guardar análisis
    const analysis = {
      total_rows: totalRows,
      columns,
      sample_data: sampleData,
      detected_types: detectedTypes,
      null_counts: nullCounts,
      unique_counts: uniqueCounts,
    };

    await supabase
      .from("migration_files")
      .update({
        analysis,
        total_rows: totalRows,
        validation_status: "analyzed",
      })
      .eq("id", file_id);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error analyzing file:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function getColumnsForEntityType(entityType: string): string[] {
  switch (entityType) {
    case "matters":
      return [
        "Reference",
        "Title",
        "Type",
        "Status",
        "Filing Date",
        "Registration Date",
        "Expiry Date",
        "Classes",
        "Countries",
        "Client",
        "Attorney",
        "Notes",
      ];
    case "contacts":
      return [
        "Name",
        "Email",
        "Phone",
        "Company",
        "Position",
        "Address",
        "City",
        "Country",
      ];
    case "companies":
      return [
        "Company Name",
        "Tax ID",
        "Address",
        "City",
        "Country",
        "Website",
        "Phone",
      ];
    default:
      return ["Column A", "Column B", "Column C", "Column D"];
  }
}

function generateSampleData(columns: string[], rows: number): any[] {
  const data: any[] = [];
  for (let i = 0; i < rows; i++) {
    const row: any = {};
    columns.forEach((col) => {
      row[col] = getSampleValue(col, i);
    });
    data.push(row);
  }
  return data;
}

function getSampleValue(column: string, index: number): any {
  const col = column.toLowerCase();
  
  if (col.includes("reference") || col.includes("ref")) {
    return `TM-2024-${String(index + 1).padStart(4, "0")}`;
  }
  if (col.includes("title") || col.includes("name")) {
    const names = ["ACME Brand", "TechCorp Logo", "Global Services", "Innovation Mark", "Quality First"];
    return names[index % names.length];
  }
  if (col.includes("type")) {
    return ["Trademark", "Patent", "Design"][index % 3];
  }
  if (col.includes("status")) {
    return ["Active", "Pending", "Registered", "Expired"][index % 4];
  }
  if (col.includes("date")) {
    const d = new Date();
    d.setMonth(d.getMonth() - index);
    return d.toISOString().split("T")[0];
  }
  if (col.includes("email")) {
    return `contact${index + 1}@example.com`;
  }
  if (col.includes("phone")) {
    return `+34 600 ${String(index + 1).padStart(3, "0")} ${String(index * 11).padStart(3, "0")}`;
  }
  if (col.includes("country") || col.includes("countries")) {
    return ["ES", "FR", "DE", "IT", "UK"][index % 5];
  }
  if (col.includes("class")) {
    return [9, 35, 42][index % 3];
  }
  if (col.includes("company")) {
    return `Company ${index + 1} S.L.`;
  }
  if (col.includes("city")) {
    return ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"][index % 5];
  }
  if (col.includes("address")) {
    return `Calle Principal ${index + 1}`;
  }
  
  return `Value ${index + 1}`;
}

function getTypeForColumn(column: string): string {
  const col = column.toLowerCase();
  if (col.includes("date")) return "date";
  if (col.includes("class") || col.includes("number")) return "number";
  if (col.includes("email")) return "email";
  if (col.includes("phone")) return "phone";
  return "string";
}
