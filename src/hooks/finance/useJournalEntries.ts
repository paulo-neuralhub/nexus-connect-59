// src/hooks/finance/useJournalEntries.ts
// Hook for journal entries (Advanced tier only - accounting)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export interface JournalEntryLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  organization_id: string;
  entry_number: string;
  entry_date: string;
  accounting_period: string;
  description: string;
  entry_type: string;
  source_type: string | null;
  source_id: string | null;
  lines: JournalEntryLine[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  status: 'draft' | 'posted';
  created_by: string | null;
  created_at: string;
}

export function useJournalEntries(period?: string) {
  const { currentOrganization } = useOrganization();
  const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

  return useQuery({
    queryKey: ['journal-entries', currentOrganization?.id, currentPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_journal_entries')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('accounting_period', currentPeriod)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      entry_date: string;
      description: string;
      entry_type: string;
      lines: JournalEntryLine[];
      source_type?: string;
      source_id?: string;
    }) => {
      const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('El asiento no está cuadrado: Debe ≠ Haber');
      }

      const period = data.entry_date.slice(0, 7);
      
      // Generate entry number
      const { count } = await supabase
        .from('fin_journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id)
        .eq('accounting_period', period);

      const entryNumber = `ASIENTO-${data.entry_date.slice(0, 4)}-${String((count || 0) + 1).padStart(6, '0')}`;

      const { data: entry, error } = await supabase
        .from('fin_journal_entries')
        .insert({
          organization_id: currentOrganization!.id,
          entry_number: entryNumber,
          entry_date: data.entry_date,
          accounting_period: period,
          description: data.description,
          entry_type: data.entry_type,
          source_type: data.source_type || 'manual',
          source_id: data.source_id,
          lines: data.lines as any,
          total_debit: totalDebit,
          total_credit: totalCredit,
          status: 'posted',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return entry as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Asiento contable registrado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}
