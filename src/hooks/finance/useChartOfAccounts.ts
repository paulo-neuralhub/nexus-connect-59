import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface ChartAccount {
  id: string;
  organization_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_code: string | null;
  group_number: number | null;
  group_name: string | null;
  is_active: boolean;
  standard: string;
  created_at: string;
}

export function useChartOfAccounts() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['chart-of-accounts', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_chart_of_accounts')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .eq('is_active', true)
        .order('account_code');
      if (error) throw error;
      return (data || []) as ChartAccount[];
    },
    enabled: !!currentOrganization?.id,
  });
}

const PGC_SPAIN_ACCOUNTS: Omit<ChartAccount, 'id' | 'organization_id' | 'created_at'>[] = [
  { account_code: '100', account_name: 'Capital social', account_type: 'equity', parent_code: null, group_number: 1, group_name: 'Financiación básica', is_active: true, standard: 'PGC_ES' },
  { account_code: '112', account_name: 'Reserva legal', account_type: 'equity', parent_code: null, group_number: 1, group_name: 'Financiación básica', is_active: true, standard: 'PGC_ES' },
  { account_code: '118', account_name: 'Aportaciones de socios', account_type: 'equity', parent_code: null, group_number: 1, group_name: 'Financiación básica', is_active: true, standard: 'PGC_ES' },
  { account_code: '129', account_name: 'Resultado del ejercicio', account_type: 'equity', parent_code: null, group_number: 1, group_name: 'Financiación básica', is_active: true, standard: 'PGC_ES' },
  { account_code: '400', account_name: 'Proveedores', account_type: 'liability', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '410', account_name: 'Acreedores por prestaciones de servicios', account_type: 'liability', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '430', account_name: 'Clientes', account_type: 'asset', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '471', account_name: 'Organismos de la Seguridad Social, acreedores', account_type: 'liability', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '473', account_name: 'HP retenciones y pagos a cuenta', account_type: 'asset', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '475', account_name: 'HP acreedora por conceptos fiscales', account_type: 'liability', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '477', account_name: 'HP IVA repercutido', account_type: 'liability', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '472', account_name: 'HP IVA soportado', account_type: 'asset', parent_code: null, group_number: 4, group_name: 'Acreedores y deudores', is_active: true, standard: 'PGC_ES' },
  { account_code: '572', account_name: 'Bancos e instituciones de crédito c/c', account_type: 'asset', parent_code: null, group_number: 5, group_name: 'Cuentas financieras', is_active: true, standard: 'PGC_ES' },
  { account_code: '570', account_name: 'Caja', account_type: 'asset', parent_code: null, group_number: 5, group_name: 'Cuentas financieras', is_active: true, standard: 'PGC_ES' },
  { account_code: '621', account_name: 'Arrendamientos y cánones', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '623', account_name: 'Servicios de profesionales independientes', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '628', account_name: 'Suministros', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '629', account_name: 'Otros servicios', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '640', account_name: 'Sueldos y salarios', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '642', account_name: 'Seguridad Social a cargo de la empresa', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '662', account_name: 'Intereses de deudas', account_type: 'expense', parent_code: null, group_number: 6, group_name: 'Compras y gastos', is_active: true, standard: 'PGC_ES' },
  { account_code: '700', account_name: 'Ventas de mercaderías', account_type: 'income', parent_code: null, group_number: 7, group_name: 'Ventas e ingresos', is_active: true, standard: 'PGC_ES' },
  { account_code: '705', account_name: 'Prestaciones de servicios', account_type: 'income', parent_code: null, group_number: 7, group_name: 'Ventas e ingresos', is_active: true, standard: 'PGC_ES' },
  { account_code: '759', account_name: 'Ingresos por servicios diversos', account_type: 'income', parent_code: null, group_number: 7, group_name: 'Ventas e ingresos', is_active: true, standard: 'PGC_ES' },
  { account_code: '769', account_name: 'Otros ingresos financieros', account_type: 'income', parent_code: null, group_number: 7, group_name: 'Ventas e ingresos', is_active: true, standard: 'PGC_ES' },
];

export function useLoadChartTemplate() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (template: 'PGC_ES' | 'PCG_FR' | 'GAAP_US' | 'IFRS') => {
      const orgId = currentOrganization!.id;
      let accounts = PGC_SPAIN_ACCOUNTS;
      // For now only PGC_ES is fully implemented
      if (template !== 'PGC_ES') {
        toast.info('Plantilla en desarrollo. Se cargará PGC España como referencia.');
      }
      const rows = accounts.map(a => ({ ...a, organization_id: orgId }));
      const { error } = await supabase.from('fin_chart_of_accounts').insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast.success('Plan de cuentas cargado');
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: { account_code: string; account_name: string; account_type: string; group_number?: number; group_name?: string }) => {
      const { error } = await supabase.from('fin_chart_of_accounts').insert({
        organization_id: currentOrganization!.id,
        ...data,
        standard: 'custom',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast.success('Cuenta creada');
    },
  });
}
