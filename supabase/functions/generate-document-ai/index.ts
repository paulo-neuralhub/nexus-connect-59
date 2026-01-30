import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Validate JWT manually (verify_jwt = false in config.toml)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create client with anon key to validate user token
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error('JWT Validation Error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid JWT' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { templateId, templateType, matterId, variables, context } = await req.json();

    // Support both templateId (DB templates) and templateType (built-in templates)
    const effectiveTemplateId = templateId || templateType;
    
    if (!effectiveTemplateId) {
      return new Response(
        JSON.stringify({ error: 'templateId or templateType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for data access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for built-in template types first
    const BUILTIN_TEMPLATES: Record<string, { name: string; systemPrompt: string; userPrompt: string }> = {
      poder_representacion: {
        name: 'Poder de representación',
        systemPrompt: 'Eres un experto en documentos legales de propiedad intelectual. Genera documentos profesionales en español.',
        userPrompt: `Genera un poder de representación para actuar en nombre del cliente en asuntos de propiedad intelectual.

Datos del expediente:
- Referencia: {{matter_reference}}
- Título: {{matter_title}}
- Tipo: {{matter_type}}
- Marca: {{mark_name}}
- Cliente: {{client_name}}
- Email cliente: {{client_email}}
- Fecha: {{today}}

El documento debe incluir:
1. Encabezado formal
2. Identificación del poderdante (cliente)
3. Identificación del apoderado (organización)
4. Alcance del poder (específico para PI)
5. Vigencia
6. Firma del poderdante`
      },
      carta_cese: {
        name: 'Carta de cese y desistimiento',
        systemPrompt: 'Eres un experto en documentos legales de propiedad intelectual. Genera documentos profesionales en español.',
        userPrompt: `Genera una carta de cese y desistimiento (cease and desist) por infracción de derechos de propiedad intelectual.

Datos del expediente:
- Referencia: {{matter_reference}}
- Marca infringida: {{mark_name}}
- Número de registro: {{registration_number}}
- Cliente titular: {{client_name}}
- Fecha: {{today}}

La carta debe:
1. Identificar claramente la marca registrada y sus derechos
2. Describir la infracción detectada
3. Solicitar el cese inmediato de la actividad infractora
4. Establecer un plazo razonable (15 días)
5. Advertir de acciones legales si no se cumple
6. Tono firme pero profesional`
      },
      informe_vigilancia: {
        name: 'Informe de vigilancia',
        systemPrompt: 'Eres un experto en propiedad intelectual especializado en vigilancia de marcas.',
        userPrompt: `Genera un informe de vigilancia de marcas para el cliente.

Datos del expediente:
- Referencia: {{matter_reference}}
- Marca vigilada: {{mark_name}}
- Clases Nice: {{nice_classes}}
- Jurisdicción: {{jurisdiction}}
- Cliente: {{client_name}}
- Fecha del informe: {{today}}

El informe debe incluir:
1. Resumen ejecutivo
2. Parámetros de búsqueda utilizados
3. Resultados encontrados (simular 2-3 marcas similares)
4. Análisis de riesgo de cada resultado
5. Recomendaciones de acción
6. Conclusiones`
      },
      informe_estado: {
        name: 'Informe de estado del expediente',
        systemPrompt: 'Eres un experto en propiedad intelectual. Genera informes claros y profesionales.',
        userPrompt: `Genera un informe de estado del expediente para enviar al cliente.

Datos del expediente:
- Referencia: {{matter_reference}}
- Título: {{matter_title}}
- Tipo: {{matter_type}}
- Marca: {{mark_name}}
- Número de solicitud: {{application_number}}
- Número de registro: {{registration_number}}
- Fecha de presentación: {{filing_date}}
- Fecha de registro: {{registration_date}}
- Fecha de vencimiento: {{expiry_date}}
- Clases Nice: {{nice_classes}}
- Jurisdicción: {{jurisdiction}}
- Cliente: {{client_name}}
- Fecha: {{today}}

El informe debe:
1. Resumir el estado actual del expediente
2. Indicar próximos pasos o acciones pendientes
3. Recordar fechas importantes
4. Mantener tono profesional y accesible`
      },
      contestacion_oposicion: {
        name: 'Contestación a oposición',
        systemPrompt: 'Eres un abogado especializado en propiedad intelectual con experiencia en oposiciones de marca.',
        userPrompt: `Genera un borrador de contestación a una oposición de marca.

Datos del expediente:
- Referencia: {{matter_reference}}
- Marca solicitada: {{mark_name}}
- Número de solicitud: {{application_number}}
- Clases Nice: {{nice_classes}}
- Cliente: {{client_name}}
- Fecha: {{today}}

El escrito debe incluir:
1. Encabezado formal dirigido a la oficina de PI
2. Identificación del procedimiento
3. Alegaciones en defensa de la marca (coexistencia, diferencias, etc.)
4. Argumentos legales
5. Solicitud de desestimación de la oposición
6. Petición final`
      },
      solicitud_renovacion: {
        name: 'Solicitud de instrucciones de renovación',
        systemPrompt: 'Eres un profesional de propiedad intelectual. Genera comunicaciones claras y profesionales.',
        userPrompt: `Genera un email solicitando instrucciones de renovación al cliente.

Datos del expediente:
- Referencia: {{matter_reference}}
- Marca: {{mark_name}}
- Número de registro: {{registration_number}}
- Fecha de vencimiento: {{expiry_date}}
- Clases Nice: {{nice_classes}}
- Jurisdicción: {{jurisdiction}}
- Cliente: {{client_name}}
- Fecha: {{today}}

El email debe:
1. Informar de la próxima renovación
2. Indicar la fecha límite
3. Solicitar confirmación de renovación
4. Indicar costes aproximados si es posible
5. Solicitar respuesta en plazo determinado
6. Tono profesional y amable`
      },
      certificado_registro: {
        name: 'Carta de confirmación de registro',
        systemPrompt: 'Eres un profesional de propiedad intelectual. Genera comunicaciones positivas y profesionales.',
        userPrompt: `Genera una carta informando al cliente del registro exitoso de su marca.

Datos del expediente:
- Referencia: {{matter_reference}}
- Marca registrada: {{mark_name}}
- Número de registro: {{registration_number}}
- Fecha de registro: {{registration_date}}
- Fecha de vencimiento: {{expiry_date}}
- Clases Nice: {{nice_classes}}
- Jurisdicción: {{jurisdiction}}
- Cliente: {{client_name}}
- Fecha: {{today}}

La carta debe:
1. Felicitar al cliente por el registro
2. Detallar los datos del registro
3. Informar de la fecha de renovación
4. Recordar la importancia de vigilar la marca
5. Ofrecer servicios adicionales
6. Tono positivo y profesional`
      },
      presupuesto: {
        name: 'Presupuesto de servicios',
        systemPrompt: 'Eres un profesional de propiedad intelectual. Genera presupuestos claros y profesionales.',
        userPrompt: `Genera un presupuesto de servicios para el cliente.

Datos del expediente:
- Referencia: {{matter_reference}}
- Tipo de servicio: {{matter_type}}
- Marca: {{mark_name}}
- Jurisdicción: {{jurisdiction}}
- Cliente: {{client_name}}
- Fecha: {{today}}

El presupuesto debe:
1. Describir los servicios incluidos
2. Desglosar honorarios profesionales
3. Indicar tasas oficiales aproximadas
4. Especificar condiciones de pago
5. Indicar validez del presupuesto
6. Incluir notas y exclusiones`
      }
    };

    let template: {
      name: string;
      template_content: string;
      ai_system_prompt: string | null;
      ai_user_prompt_template: string | null;
      ai_model: string;
      ai_temperature: number;
      ai_max_tokens: number;
      variables: Array<{ key: string; source: string; source_path?: string }>;
      usage_count?: number;
    } | null = null;
    let isBuiltIn = false;

    // Check built-in templates first
    if (BUILTIN_TEMPLATES[effectiveTemplateId]) {
      const builtIn = BUILTIN_TEMPLATES[effectiveTemplateId];
      template = {
        name: builtIn.name,
        template_content: '{{ai_content}}',
        ai_system_prompt: builtIn.systemPrompt,
        ai_user_prompt_template: builtIn.userPrompt,
        ai_model: 'claude-sonnet-4-5-20250929',
        ai_temperature: 0.3,
        ai_max_tokens: 4096,
        variables: [{ key: 'ai_content', source: 'ai' }],
      };
      isBuiltIn = true;
    } else {
      // Try to fetch from database
      const { data: dbTemplate, error: templateError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', effectiveTemplateId)
        .single();

      if (templateError || !dbTemplate) {
        return new Response(
          JSON.stringify({ error: `Template '${effectiveTemplateId}' not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      template = dbTemplate;
    }

    // At this point template should never be null, but TypeScript needs assurance
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template could not be loaded' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge context variables with explicit variables
    const allVariables = { ...context, ...variables };

    // Get matter data if matterId is provided
    let matterData: Record<string, unknown> | null = null;
    if (matterId) {
      const { data: matter } = await supabase
        .from('matters')
        .select(`
          *,
          contact:contacts(id, name, email, phone, company_name, address_line1, city, country),
          organization:organizations(id, name)
        `)
        .eq('id', matterId)
        .single();
      
      if (matter) {
        matterData = {
          ...matter,
          matter: matter, // Also expose as "matter" for source_path
        };
      }
    }

    // Resolve all variables
    const resolvedVariables: Record<string, string | number | null> = {};
    const templateVariables = template.variables || [];

    for (const varDef of templateVariables) {
      if (varDef.source === 'auto' && varDef.source_path) {
        if (varDef.source_path === 'TODAY') {
          resolvedVariables[varDef.key] = new Date().toISOString().split('T')[0];
        } else if (matterData) {
          // Navigate nested path
          const value = getNestedValue(matterData, varDef.source_path);
          resolvedVariables[varDef.key] = value ?? allVariables?.[varDef.key] ?? '';
        } else {
          resolvedVariables[varDef.key] = allVariables?.[varDef.key] ?? '';
        }
      } else if (varDef.source === 'manual') {
        resolvedVariables[varDef.key] = allVariables?.[varDef.key] ?? '';
      }
      // AI variables will be populated after AI generation
    }

    // Check for AI variables
    const aiVariables = templateVariables.filter((v: { source: string }) => v.source === 'ai');
    let tokensUsed = 0;

    if (aiVariables.length > 0 && template.ai_user_prompt_template) {
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Initialize Anthropic
      const anthropic = new Anthropic({
        apiKey: anthropicApiKey,
      });

      // Build user prompt with context and resolved variables
      let userPrompt = template.ai_user_prompt_template;
      
      // Replace with context variables first
      for (const [key, value] of Object.entries(allVariables || {})) {
        userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
      }
      // Then resolved variables
      for (const [key, value] of Object.entries(resolvedVariables)) {
        userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
      }

      // Call Claude
      const response = await anthropic.messages.create({
        model: template.ai_model || 'claude-sonnet-4-5-20250929',
        max_tokens: template.ai_max_tokens || 4096,
        temperature: Number(template.ai_temperature) || 0.3,
        system: template.ai_system_prompt || 'You are a professional legal document writer. Write in Spanish unless otherwise specified.',
        messages: [{ role: 'user', content: userPrompt }],
      });

      const aiContent = response.content[0].type === 'text' ? response.content[0].text : '';
      tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      // Assign AI content to AI variables
      // For simplicity, assign to first AI variable if multiple exist
      for (const aiVar of aiVariables) {
        resolvedVariables[aiVar.key] = aiContent;
      }
    }

    // Generate final document by replacing all variables
    let finalContent = template.template_content;
    for (const [key, value] of Object.entries(resolvedVariables)) {
      finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value || `[${key}]`));
    }
    // Replace any remaining context/manual variables
    for (const [key, value] of Object.entries(allVariables || {})) {
      finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value || `[${key}]`));
    }

    // Increment usage count only for DB templates
    if (!isBuiltIn) {
      await supabase
        .from('document_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', effectiveTemplateId);
    }

    const generationTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        content: finalContent,
        variables: { ...resolvedVariables, ...variables },
        generationTime,
        tokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}
