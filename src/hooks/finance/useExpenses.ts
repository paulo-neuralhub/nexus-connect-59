/**
 * Expenses Hooks
 * L62-D: Finance Module - Gastos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { format } from 'date-fns';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';
export type ExpenseBillingStatus = 'unbilled' | 'ready' | 'billed' | 'written_off';
export type ExpenseCategory = 'official_fees' | 'translation' | 'courier' | 'travel' | 'certification' | 'apostille' | 'materials' | 'meals' | 'accommodation' | 'other';

export interface Expense {
  id: string;
  organization_id: string;
  user_id: string;
  matter_id?: string;
  contact_id?: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  receipt_url?: string;
  receipt_file_name?: string;
  is_billable: boolean;
  markup_percent: number;
  status: ExpenseStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  billing_status: ExpenseBillingStatus;
  invoice_id?: string;
  invoice_line_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  matter?: {
    id: string;
    reference: string;
    title: string;
  };
  contact?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    full_name: string;
  };
  approver?: {
    id: string;
    full_name: string;
  };
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  matterId?: string;
  contactId?: string;
  userId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  billingStatus?: ExpenseBillingStatus;
  isBillable?: boolean;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string }> = {
  official_fees: { label: 'Tasa oficial', icon: 'Building' },
  translation: { label: 'Traducción', icon: 'Languages' },
  courier: { label: 'Mensajería/Courier', icon: 'Send' },
  travel: { label: 'Viaje/Transporte', icon: 'Car' },
  certification: { label: 'Certificación', icon: 'FileCheck' },
  apostille: { label: 'Apostilla', icon: 'Stamp' },
  materials: { label: 'Materiales', icon: 'Package' },
  meals: { label: 'Comidas', icon: 'UtensilsCrossed' },
  accommodation: { label: 'Alojamiento', icon: 'Bed' },
  other: { label: 'Otros', icon: 'MoreHorizontal' },
};

export const EXPENSE_STATUSES: Record<ExpenseStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  reimbursed: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-700' },
};

// Get expenses with filters
export function useExpenses(filters: ExpenseFilters = {}) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['expenses', currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = (supabase as any)
        .from('expenses')
        .select(`
          *,
          matter:matters(id, reference, title),
          contact:contacts(id, name),
          user:profiles!expenses_user_id_fkey(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('date', format(filters.startDate, 'yyyy-MM-dd'));
      }
      if (filters.endDate) {
        query = query.lte('date', format(filters.endDate, 'yyyy-MM-dd'));
      }
      if (filters.matterId) {
        query = query.eq('matter_id', filters.matterId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.isBillable !== undefined) {
        query = query.eq('is_billable', filters.isBillable);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!currentOrganization?.id,
  });
}

// Get single expense
export function useExpense(id: string | undefined) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await (supabase as any)
        .from('expenses')
        .select(`
          *,
          matter:matters(id, reference, title),
          contact:contacts(id, name),
          user:users!expenses_user_id_fkey(id, full_name),
          approver:users!expenses_approved_by_fkey(id, full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Expense | null;
    },
    enabled: !!id && !!currentOrganization?.id,
  });
}

// Get unbilled expenses (for invoicing)
export function useUnbilledExpenses(matterId?: string, contactId?: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['unbilled-expenses', currentOrganization?.id, matterId, contactId],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = (supabase as any)
        .from('expenses')
        .select(`
          *,
          matter:matters(id, reference, title),
          contact:contacts(id, name),
          user:users!expenses_user_id_fkey(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_billable', true)
        .eq('status', 'approved')
        .in('billing_status', ['unbilled', 'ready'])
        .order('date', { ascending: true });

      if (matterId) {
        query = query.eq('matter_id', matterId);
      }
      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!currentOrganization?.id,
  });
}

// Create expense
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      category: ExpenseCategory;
      description: string;
      amount: number;
      currency?: string;
      vat_rate?: number;
      matter_id?: string;
      contact_id?: string;
      receipt_url?: string;
      receipt_file_name?: string;
      is_billable?: boolean;
      markup_percent?: number;
    }) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('No organization or user');
      }

      const vatRate = data.vat_rate ?? 21;
      const vatAmount = data.amount * (vatRate / 100);
      const totalAmount = data.amount + vatAmount;

      const { data: expense, error } = await (supabase as any)
        .from('expenses')
        .insert({
          organization_id: currentOrganization.id,
          user_id: user.id,
          date: data.date,
          category: data.category,
          description: data.description,
          amount: data.amount,
          currency: data.currency || 'EUR',
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          matter_id: data.matter_id || null,
          contact_id: data.contact_id || null,
          receipt_url: data.receipt_url || null,
          receipt_file_name: data.receipt_file_name || null,
          is_billable: data.is_billable ?? true,
          markup_percent: data.markup_percent ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['unbilled-expenses'] });
    },
  });
}

// Update expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Expense> & { id: string }) => {
      // Recalculate totals if amount or vat_rate changes
      if (updates.amount !== undefined || updates.vat_rate !== undefined) {
        const amount = updates.amount ?? 0;
        const vatRate = updates.vat_rate ?? 21;
        updates.vat_amount = amount * (vatRate / 100);
        updates.total_amount = amount + updates.vat_amount;
      }

      const { data, error } = await (supabase as any)
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense'] });
      queryClient.invalidateQueries({ queryKey: ['unbilled-expenses'] });
    },
  });
}

// Delete expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['unbilled-expenses'] });
    },
  });
}

// Approve expense
export function useApproveExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await (supabase as any)
        .from('expenses')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense'] });
      queryClient.invalidateQueries({ queryKey: ['unbilled-expenses'] });
    },
  });
}

// Reject expense
export function useRejectExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await (supabase as any)
        .from('expenses')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense'] });
    },
  });
}

// Mark expenses as billed
export function useMarkExpensesAsBilled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      expenseIds: string[];
      invoiceId: string;
    }) => {
      const { error } = await (supabase as any)
        .from('expenses')
        .update({
          billing_status: 'billed',
          invoice_id: data.invoiceId,
        })
        .in('id', data.expenseIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['unbilled-expenses'] });
    },
  });
}

// Get expense summary for a matter
export function useExpenseSummary(matterId: string | undefined) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['expense-summary', matterId],
    queryFn: async () => {
      if (!matterId || !currentOrganization?.id) return null;

      const { data, error } = await (supabase as any)
        .from('expenses')
        .select('total_amount, is_billable, billing_status, status')
        .eq('organization_id', currentOrganization.id)
        .eq('matter_id', matterId);

      if (error) throw error;

      const expenses = data as Array<{
        total_amount: number;
        is_billable: boolean;
        billing_status: ExpenseBillingStatus;
        status: ExpenseStatus;
      }>;

      return {
        total: expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0),
        billable: expenses.filter(e => e.is_billable).reduce((sum, e) => sum + (e.total_amount || 0), 0),
        unbilled: expenses.filter(e => e.is_billable && e.billing_status !== 'billed').reduce((sum, e) => sum + (e.total_amount || 0), 0),
        billed: expenses.filter(e => e.billing_status === 'billed').reduce((sum, e) => sum + (e.total_amount || 0), 0),
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
      };
    },
    enabled: !!matterId && !!currentOrganization?.id,
  });
}
