/**
 * MatterDetailsEditTab - Inline edit form for matter fields
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { MatterV2 } from '@/hooks/use-matters-v2';
import { MATTER_STATUSES } from '@/lib/constants/matters';

interface MatterDetailsEditTabProps {
  matter: MatterV2;
}

export function MatterDetailsEditTab({ matter }: MatterDetailsEditTabProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: matter.title || '',
    reference: matter.reference || '',
    status: matter.status || 'draft',
    mark_name: matter.mark_name || '',
    internal_notes: matter.internal_notes || '',
    goods_services: matter.goods_services || '',
    tags: (matter.tags || []).join(', '),
  });

  const updateMatter = useMutation({
    mutationFn: async () => {
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase
        .from('matters')
        .update({
          title: form.title,
          reference: form.reference || null,
          status: form.status,
          mark_name: form.mark_name || null,
          internal_notes: form.internal_notes || null,
          goods_services: form.goods_services || null,
          tags: tagsArray.length ? tagsArray : null,
        })
        .eq('id', matter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matter-v2', matter.id] });
      toast.success('Expediente actualizado');
    },
    onError: () => toast.error('Error al guardar cambios'),
  });

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Información básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Título / Nombre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Referencia interna</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm(p => ({ ...p, reference: e.target.value }))}
                placeholder="IP-2024-0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MATTER_STATUSES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Denominación de marca</Label>
              <Input
                value={form.mark_name}
                onChange={(e) => setForm(p => ({ ...p, mark_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Productos / Servicios</Label>
            <Textarea
              value={form.goods_services}
              onChange={(e) => setForm(p => ({ ...p, goods_services: e.target.value }))}
              placeholder="Descripción de productos y servicios..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label>Notas internas</Label>
            <Textarea
              value={form.internal_notes}
              onChange={(e) => setForm(p => ({ ...p, internal_notes: e.target.value }))}
              placeholder="Notas visibles solo para el equipo..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label>Etiquetas (separadas por coma)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="urgente, renovación, madrid..."
            />
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => updateMatter.mutate()} disabled={updateMatter.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
