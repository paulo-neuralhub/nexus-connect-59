// ============================================================
// LinkToMatterDropdown - Link a call CDR to a matter
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LinkToMatterDropdownProps {
  accountId: string;
  cdrId: string;
  activityId: string;
  contactName?: string;
  duration?: number;
  outcome?: string;
  onLinked: () => void;
  onCancel: () => void;
}

export function LinkToMatterDropdown({
  accountId,
  cdrId,
  activityId,
  contactName,
  duration,
  outcome,
  onLinked,
  onCancel,
}: LinkToMatterDropdownProps) {
  const [selectedMatter, setSelectedMatter] = useState<string>('');
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch matters for the account
  const { data: matters = [], isLoading } = useQuery({
    queryKey: ['account-matters', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select('id, title, reference_number, status')
        .eq('organization_id', currentOrganization?.id ?? '')
        .or(`client_id.eq.${accountId},crm_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId && !!currentOrganization?.id,
  });

  const linkMutation = useMutation({
    mutationFn: async (matterId: string) => {
      // 1. Update CDR matter_id
      const { error: cdrError } = await supabase
        .from('telephony_cdrs')
        .update({ matter_id: matterId })
        .eq('id', cdrId);
      if (cdrError) throw cdrError;

      // 2. Update crm_activity metadata
      const { data: activity } = await supabase
        .from('crm_activities')
        .select('metadata')
        .eq('id', activityId)
        .single();

      const existingMeta = (activity?.metadata as Record<string, unknown>) || {};
      await supabase
        .from('crm_activities')
        .update({
          metadata: { ...existingMeta, matter_id: matterId },
        })
        .eq('id', activityId);

      // 3. Insert matter activity_log
      const matter = matters.find(m => m.id === matterId);
      const durationStr = duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : '';

      await supabase.from('activity_log').insert({
        organization_id: currentOrganization!.id,
        entity_type: 'matter',
        entity_id: matterId,
        matter_id: matterId,
        action: 'call_logged',
        title: `Llamada ${outcome || 'registrada'}`,
        description: `Llamada con ${contactName || 'contacto'} - ${durationStr} - ${outcome || ''}`.trim(),
      });

      return matterId;
    },
    onSuccess: () => {
      toast.success('Llamada vinculada al expediente');
      queryClient.invalidateQueries({ queryKey: ['client-activity-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['communication-history'] });
      onLinked();
    },
    onError: () => {
      toast.error('Error al vincular la llamada');
    },
  });

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
      <Select value={selectedMatter} onValueChange={setSelectedMatter} disabled={isLoading}>
        <SelectTrigger className="flex-1 h-8 text-xs">
          <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccionar expediente'} />
        </SelectTrigger>
        <SelectContent>
          {matters.map(m => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              {m.reference_number ? `${m.reference_number} - ` : ''}{m.title}
            </SelectItem>
          ))}
          {matters.length === 0 && !isLoading && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No hay expedientes para esta cuenta
            </div>
          )}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="h-8 gap-1 text-xs"
        disabled={!selectedMatter || linkMutation.isPending}
        onClick={() => linkMutation.mutate(selectedMatter)}
      >
        {linkMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Vincular
      </Button>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
