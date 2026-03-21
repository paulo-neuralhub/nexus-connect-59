// src/hooks/finance/useBankAccounts.ts
// Hook for bank accounts and transactions (Advanced tier only)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  organization_id: string;
  account_name: string;
  bank_name: string | null;
  iban: string | null;
  bic_swift: string | null;
  currency: string;
  current_balance: number;
  last_reconciled_at: string | null;
  last_reconciled_balance: number | null;
  is_active: boolean;
  is_default: boolean;
  bank_connection_type: string;
  chart_account_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  organization_id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date: string | null;
  description: string;
  amount: number;
  currency: string;
  amount_eur: number | null;
  balance_after: number | null;
  bank_reference: string | null;
  reconciliation_status: 'unmatched' | 'matched' | 'manual_match' | 'excluded';
  matched_invoice_id: string | null;
  matched_expense_id: string | null;
  matched_at: string | null;
  source: string;
  created_at: string;
}

export function useBankAccounts() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['bank-accounts', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_bank_accounts')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: Partial<BankAccount>) => {
      const { data: account, error } = await supabase
        .from('fin_bank_accounts')
        .insert({
          organization_id: currentOrganization!.id,
          account_name: data.account_name || '',
          bank_name: data.bank_name,
          iban: data.iban,
          bic_swift: data.bic_swift,
          currency: data.currency || 'EUR',
          is_default: data.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      return account as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Cuenta bancaria creada');
    },
  });
}

export function useBankTransactions(bankAccountId: string | undefined, filter?: string) {
  return useQuery({
    queryKey: ['bank-transactions', bankAccountId, filter],
    queryFn: async () => {
      if (!bankAccountId) return [];

      let query = supabase
        .from('fin_bank_transactions')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .order('transaction_date', { ascending: false })
        .limit(200);

      if (filter && filter !== 'all') {
        query = query.eq('reconciliation_status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!bankAccountId,
  });
}
