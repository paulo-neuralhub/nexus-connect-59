// ============================================
// src/components/matters/EditPartyModal.tsx
// Modal to edit an existing party on a matter
// ============================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clock } from 'lucide-react';
import { usePartyRoles, useUpdateMatterParty, type MatterParty } from '@/hooks/legal-ops/useMatterParties';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formSchema = z.object({
  party_role: z.string().min(1, 'Selecciona un rol'),
  external_name: z.string().optional(),
  external_address: z.string().optional(),
  external_country: z.string().optional(),
  external_email: z.string().email().optional().or(z.literal('')),
  external_phone: z.string().optional(),
  percentage: z.number().min(0).max(100).optional(),
  is_primary: z.boolean().default(false),
  jurisdiction: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party: MatterParty | null;
  matterId: string;
  matterType?: string;
}

export function EditPartyModal({ 
  open, 
  onOpenChange, 
  party,
  matterId,
  matterType = 'trademark'
}: EditPartyModalProps) {
  const { toast } = useToast();
  const { data: roles, isLoading: rolesLoading } = usePartyRoles(matterType);
  const updateParty = useUpdateMatterParty();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      party_role: '',
      is_primary: false,
    },
  });

  // Populate form when party changes
  useEffect(() => {
    if (party && open) {
      form.reset({
        party_role: party.party_role || '',
        external_name: party.external_name || party.client?.name || '',
        external_address: party.external_address || '',
        external_country: party.external_country || '',
        external_email: party.external_email || party.client?.email || '',
        external_phone: party.external_phone || '',
        percentage: party.percentage ?? undefined,
        is_primary: party.is_primary || false,
        jurisdiction: party.jurisdiction || '',
        notes: party.notes || '',
      });
    }
  }, [party, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!party) return;
    
    try {
      await updateParty.mutateAsync({
        partyId: party.id,
        matterId: matterId,
        updates: {
          party_role: values.party_role,
          external_name: values.external_name,
          external_address: values.external_address,
          external_country: values.external_country,
          external_email: values.external_email,
          external_phone: values.external_phone,
          percentage: values.percentage,
          is_primary: values.is_primary,
          jurisdiction: values.jurisdiction,
          notes: values.notes,
        },
      });

      toast({ title: 'Parte actualizada correctamente' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Error al actualizar parte', variant: 'destructive' });
    }
  };

  // Group roles by category
  const groupedRoles = roles?.reduce((acc, role) => {
    const cat = role.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {} as Record<string, typeof roles>);

  const categoryLabels: Record<string, string> = {
    ownership: 'Titularidad',
    creation: 'Creación',
    representation: 'Representación',
    other: 'Otros',
  };

  // Get display name for party
  const getPartyDisplayName = () => {
    if (party?.client?.name) return party.client.name;
    if (party?.external_name) return party.external_name;
    return 'Sin nombre';
  };

  const getRoleLabel = () => {
    return party?.role_info?.name_es || party?.party_role || 'Parte';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar {getRoleLabel()} - {getPartyDisplayName()}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Party Role */}
            <FormField
              control={form.control}
              name="party_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol de la parte *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesLoading ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Cargando...
                        </div>
                      ) : (
                        Object.entries(groupedRoles || {}).map(([category, categoryRoles]) => (
                          <SelectGroup key={category}>
                            <SelectLabel>{categoryLabels[category] || category}</SelectLabel>
                            {categoryRoles?.map(role => (
                              <SelectItem key={role.code} value={role.code}>
                                {role.name_es}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Editable Fields */}
            <div className="space-y-3 p-4 border rounded-xl bg-slate-50/50">
              <FormField
                control={form.control}
                name="external_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo o razón social" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="external_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@ejemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="external_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+34 600 000 000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="external_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="España" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="external_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Dirección completa" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100}
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdicción</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ES, EU, WIPO..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <FormLabel className="text-base">Parte principal</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marcar como parte principal de este rol
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Notas adicionales..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last modified info */}
            {party?.updated_at && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>
                  Última modificación: {format(new Date(party.updated_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateParty.isPending}>
                {updateParty.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
