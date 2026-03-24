// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { Instruction } from "@/hooks/use-instructions";

/* ── Fee estimates (hardcoded for now) ── */
export const JURISDICTION_FEES: Record<string, { official: number; professional: number }> = {
  EU: { official: 850, professional: 1200 },
  US: { official: 350, professional: 1500 },
  GB: { official: 200, professional: 800 },
  ES: { official: 150, professional: 600 },
  JP: { official: 500, professional: 1800 },
  PCT: { official: 1500, professional: 2000 },
  EP: { official: 1200, professional: 2500 },
  DE: { official: 300, professional: 700 },
  FR: { official: 250, professional: 700 },
  IT: { official: 200, professional: 650 },
  PT: { official: 150, professional: 500 },
  CN: { official: 400, professional: 1200 },
  KR: { official: 350, professional: 1100 },
  AU: { official: 300, professional: 900 },
  IN: { official: 200, professional: 600 },
  BR: { official: 250, professional: 700 },
  MX: { official: 200, professional: 600 },
  CA: { official: 300, professional: 800 },
  AR: { official: 150, professional: 500 },
  WO: { official: 1500, professional: 2000 },
};

const DEFAULT_FEES = { official: 300, professional: 800 };

export function getFeesForJurisdiction(code: string) {
  return JURISDICTION_FEES[code.toUpperCase()] || DEFAULT_FEES;
}

/* ── Pipeline mapping ── */
const PIPELINE_MAP: Record<string, string> = {
  trademark_registration: 'b0100002-0000-0000-0000-000000000002',
  trademark_renewal: 'b0100005-0000-0000-0000-000000000005',
  renewal: 'b0100005-0000-0000-0000-000000000005',
  patent_application: 'b0100003-0000-0000-0000-000000000003',
  patent_prosecution: 'b0100003-0000-0000-0000-000000000003',
  patent_renewal: 'b0100005-0000-0000-0000-000000000005',
  opposition: 'b0100004-0000-0000-0000-000000000004',
  design: 'b0100002-0000-0000-0000-000000000002',
};

const TYPE_TO_MATTER: Record<string, string> = {
  trademark_registration: 'trademark',
  trademark_renewal: 'trademark',
  renewal: 'trademark',
  patent_application: 'patent',
  patent_prosecution: 'patent',
  patent_renewal: 'patent',
  opposition: 'trademark',
  design: 'design',
  surveillance: 'trademark',
  assignment: 'trademark',
};

/* ── Helper: get primary contact for account ── */
async function getPrimaryContact(accountId: string) {
  const { data } = await fromTable('contacts')
    .select('id')
    .eq('account_id', accountId)
    .eq('is_primary', true)
    .limit(1);
  return data?.[0]?.id || null;
}

/* ── Helper: generate next reference ── */
async function generateNextReference(orgId: string) {
  const year = new Date().getFullYear();
  const prefix = 'MER';
  const { data } = await fromTable('matters')
    .select('reference')
    .eq('organization_id', orgId)
    .like('reference', `${prefix}-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const parts = data[0].reference.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
}

/* ══════════════════════════════════════════
   HOOK: useAcknowledge
   ══════════════════════════════════════════ */
export function useAcknowledge() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (instruction: Instruction) => {
      if (instruction.acknowledgement_sent_at) {
        const d = new Date(instruction.acknowledgement_sent_at).toLocaleDateString('es-ES');
        toast.info(`Acuse ya enviado el ${d}`);
        return { alreadySent: true };
      }

      const now = new Date().toISOString();
      const { error } = await fromTable('bulk_instructions')
        .update({ acknowledgement_sent_at: now, updated_at: now })
        .eq('id', instruction.id);
      if (error) throw error;

      // Log activity
      const contactId = instruction.crm_account_id
        ? await getPrimaryContact(instruction.crm_account_id)
        : null;

      await fromTable('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        type: 'email',
        owner_type: 'organization',
        subject: `Acuse de recibo enviado — ${instruction.title}`,
        content: 'Se ha enviado confirmación de recepción de la instrucción al cliente.',
        created_by: profile?.id,
      });

      return { alreadySent: false };
    },
    onSuccess: (result) => {
      if (!result.alreadySent) {
        toast.success('✅ Acuse enviado correctamente');
      }
      qc.invalidateQueries({ queryKey: ['instructions'] });
    },
    onError: () => toast.error('Error al enviar acuse'),
  });
}

/* ══════════════════════════════════════════
   HOOK: useConflictCheck
   ══════════════════════════════════════════ */
export function useConflictCheck() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (instruction: Instruction) => {
      // Fetch client matters
      const { data: matters } = await fromTable('matters')
        .select('id, reference, title, type, mark_name, status, jurisdiction')
        .eq('crm_account_id', instruction.crm_account_id)
        .eq('organization_id', organizationId);

      // Fetch spider alerts if trademark
      let alerts: any[] = [];
      if (instruction.instruction_type?.includes('trademark')) {
        const { data: spiderAlerts } = await fromTable('spider_alerts')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('status', 'new')
          .limit(5);
        alerts = spiderAlerts || [];
      }

      // Mark as checked
      const now = new Date().toISOString();
      const { error } = await fromTable('bulk_instructions')
        .update({ conflict_checked: true, updated_at: now })
        .eq('id', instruction.id);
      if (error) throw error;

      return { matters: matters || [], alerts };
    },
    onSuccess: () => {
      toast.success('✅ Conflictos verificados');
      qc.invalidateQueries({ queryKey: ['instructions'] });
    },
    onError: () => toast.error('Error al verificar conflictos'),
  });
}

/* ══════════════════════════════════════════
   HOOK: useSendQuote (enhanced with generated_documents)
   ══════════════════════════════════════════ */
export function useSendQuote() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      instruction: Instruction;
      quoteNumber: string;
      htmlContent: string;
      templateId: string;
      total: number;
      lines: any[];
      discount: number;
      taxRate: number;
      notes: string;
    }) => {
      const { instruction, quoteNumber, htmlContent, templateId, total, lines, discount, taxRate, notes } = params;
      const now = new Date().toISOString();

      // Update instruction
      const { error } = await fromTable('bulk_instructions')
        .update({ quote_sent_at: now, updated_at: now })
        .eq('id', instruction.id);
      if (error) throw error;

      // Save as generated_document
      await fromTable('generated_documents').insert({
        organization_id: organizationId,
        client_id: instruction.crm_account_id,
        title: `Presupuesto — ${instruction.title}`,
        name: `${quoteNumber}.pdf`,
        document_number: quoteNumber,
        category: 'quote',
        content: htmlContent,
        content_html: htmlContent,
        status: 'sent',
        document_date: now,
        created_by: profile?.id,
        template_id: templateId,
        total_amount: total,
        discount_amount: total * (discount / 100) / (1 - discount / 100), // approximate
        tax_amount: total * (taxRate / (100 + taxRate)), // approximate
        subtotal: Math.round(total / (1 + taxRate / 100)),
        variables_input: { lines, discount, taxRate, notes, quoteNumber },
      });

      // Log activity
      const contactId = instruction.crm_account_id
        ? await getPrimaryContact(instruction.crm_account_id)
        : null;

      await fromTable('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        type: 'email',
        owner_type: 'organization',
        subject: `Presupuesto enviado — ${instruction.title}`,
        content: `Presupuesto ${quoteNumber} enviado por importe total de €${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
        created_by: profile?.id,
      });

      return { quoteNumber, total };
    },
    onSuccess: (result) => {
      toast.success(`✅ Presupuesto enviado — €${result.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
      qc.invalidateQueries({ queryKey: ['instructions'] });
    },
    onError: () => toast.error('Error al enviar presupuesto'),
  });
}

/* ══════════════════════════════════════════
   HOOK: useApproveQuote
   ══════════════════════════════════════════ */
export function useApproveQuote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (instructionId: string) => {
      const now = new Date().toISOString();
      const { error } = await fromTable('bulk_instructions')
        .update({ quote_approved_at: now, updated_at: now })
        .eq('id', instructionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Presupuesto aprobado por el cliente');
      qc.invalidateQueries({ queryKey: ['instructions'] });
    },
    onError: () => toast.error('Error al aprobar presupuesto'),
  });
}

/* ══════════════════════════════════════════
   HOOK: useExecuteInstruction
   ══════════════════════════════════════════ */
export function useExecuteInstruction() {
  const qc = useQueryClient();
  const { organizationId } = useOrganization();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (instruction: Instruction) => {
      const items = (instruction.items || []).filter(
        it => it.status === 'pending' || it.status === 'confirmed'
      );
      if (items.length === 0) throw new Error('No hay items pendientes para ejecutar');

      const matterType = TYPE_TO_MATTER[instruction.instruction_type] || 'trademark';
      const pipelineId = PIPELINE_MAP[instruction.instruction_type] || PIPELINE_MAP.trademark_registration;

      // Get first stage
      const { data: stages } = await fromTable('crm_pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true })
        .limit(1);
      const firstStageId = stages?.[0]?.id || null;

      const contactId = instruction.crm_account_id
        ? await getPrimaryContact(instruction.crm_account_id)
        : null;

      let executedCount = 0;
      const createdMatters: string[] = [];

      for (const item of items) {
        try {
          // A) Generate reference and create matter
          const reference = await generateNextReference(organizationId);
          const jCode = (item.jurisdiction_code || '').toUpperCase();
          const fees = getFeesForJurisdiction(jCode);
          const totalCost = fees.official + fees.professional;

          const { data: matter, error: matterErr } = await fromTable('matters')
            .insert({
              organization_id: organizationId,
              reference,
              title: `${instruction.title} — ${jCode}`,
              type: matterType,
              ip_type: matterType,
              status: 'pending',
              jurisdiction_code: jCode,
              client_id: instruction.crm_account_id,
              crm_account_id: instruction.crm_account_id,
              assigned_to: profile?.id,
              created_by: profile?.id,
              official_fees: fees.official,
              professional_fees: fees.professional,
              total_cost: totalCost,
              currency: 'EUR',
            })
            .select('id')
            .single();

          if (matterErr) {
            console.error('[Execute] Matter creation failed:', matterErr);
            continue;
          }

          createdMatters.push(matter.id);

          // D) Create deal
          await fromTable('crm_deals').insert({
            organization_id: organizationId,
            account_id: instruction.crm_account_id,
            contact_id: contactId,
            name: `${instruction.title} [${jCode}]`,
            pipeline_id: pipelineId,
            pipeline_stage_id: firstStageId,
            stage: 'active',
            deal_type: instruction.instruction_type,
            jurisdiction_code: jCode,
            matter_id: matter.id,
            owner_id: profile?.id,
            assigned_to: profile?.id,
            amount: totalCost,
            amount_eur: totalCost,
          });

          // E) Update item
          await fromTable('bulk_instruction_items')
            .update({
              status: 'executed',
              executed_at: new Date().toISOString(),
              matter_id: matter.id,
            })
            .eq('id', item.id);

          executedCount++;
        } catch (err) {
          console.error('[Execute] Item failed:', item.id, err);
        }
      }

      // Step 3: Update instruction
      const allItems = instruction.items || [];
      const totalExecuted = (instruction.executed_count || 0) + executedCount;
      const allDone = totalExecuted >= allItems.length;
      const now = new Date().toISOString();

      await fromTable('bulk_instructions')
        .update({
          executed_count: totalExecuted,
          status: allDone ? 'completed' : 'partially_executed',
          completed_at: allDone ? now : null,
          updated_at: now,
        })
        .eq('id', instruction.id);

      // Step 4: Activity log
      if (contactId) {
        await fromTable('activities').insert({
          organization_id: organizationId,
          contact_id: contactId,
          type: 'note',
          owner_type: 'organization',
          subject: `Instrucción ejecutada — ${instruction.title}`,
          content: `Se han creado ${executedCount} expedientes y ${executedCount} deals automáticamente.`,
          created_by: profile?.id,
        });
      }

      return { executedCount, createdMatters };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['instructions'] });
      qc.invalidateQueries({ queryKey: ['matters'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
      // Toast handled in component for navigation links
    },
    onError: (err: any) => {
      console.error('[Execute] Failed:', err);
      toast.error('Error al ejecutar la instrucción');
    },
  });
}
