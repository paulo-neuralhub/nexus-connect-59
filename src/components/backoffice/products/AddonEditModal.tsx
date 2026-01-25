// ============================================================
// IP-NEXUS BACKOFFICE - Addon Edit Modal
// ============================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useUpdateProduct,
  useUpsertProductPrice,
  useUpsertAddonConfig,
  usePlans,
} from '@/hooks/backoffice';
import type { AddonWithDetails } from '@/hooks/backoffice/useProductAddons';

const addonSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  is_active: z.boolean(),
  price_monthly: z.number().min(0),
  available_for_plans: z.array(z.string()),
  included_in_plans: z.array(z.string()),
  min_plan_required: z.string().optional(),
});

type AddonFormData = z.infer<typeof addonSchema>;

interface AddonEditModalProps {
  addon: AddonWithDetails;
  open: boolean;
  onClose: () => void;
}

export function AddonEditModal({ addon, open, onClose }: AddonEditModalProps) {
  const { data: plans } = usePlans();
  const updateProduct = useUpdateProduct();
  const updatePrice = useUpsertProductPrice();
  const updateConfig = useUpsertAddonConfig();

  const monthlyPrice = addon.prices?.find(p => p.billing_period === 'monthly')?.price ?? 0;

  const form = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: addon.product.name,
      description: addon.product.description ?? '',
      is_active: addon.product.is_active,
      price_monthly: monthlyPrice,
      available_for_plans: addon.available_for_plans ?? [],
      included_in_plans: addon.included_in_plans ?? [],
      min_plan_required: addon.min_plan_required ?? '',
    },
  });

  const handleSubmit = async (data: AddonFormData) => {
    try {
      // Update product info
      await updateProduct.mutateAsync({
        id: addon.product.id,
        data: {
          name: data.name,
          description: data.description,
          is_active: data.is_active,
        },
      });

      // Update price
      await updatePrice.mutateAsync({
        product_id: addon.product.id,
        billing_period: 'monthly',
        price: data.price_monthly,
        currency: 'EUR',
      });

      // Update addon config
      await updateConfig.mutateAsync({
        addon_product_id: addon.product.id,
        available_for_plans: data.available_for_plans,
        included_in_plans: data.included_in_plans,
        min_plan_required: data.min_plan_required || null,
      });

      onClose();
    } catch (error) {
      console.error('Error saving addon:', error);
    }
  };

  const togglePlanInArray = (
    fieldName: 'available_for_plans' | 'included_in_plans',
    planCode: string
  ) => {
    const current = form.getValues(fieldName);
    const updated = current.includes(planCode)
      ? current.filter(c => c !== planCode)
      : [...current, planCode];
    form.setValue(fieldName, updated);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Add-on: {addon.product.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio mensual</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                          <span className="text-muted-foreground">€</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <FormDescription>
                          Disponible para compra
                        </FormDescription>
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

                <Separator />

                <div className="space-y-2">
                  <FormLabel>Disponible para planes</FormLabel>
                  <FormDescription>
                    Planes desde los que se puede comprar este add-on
                  </FormDescription>
                  <div className="space-y-2">
                    {plans?.map(plan => (
                      <div key={plan.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`available-${plan.id}`}
                          checked={form.watch('available_for_plans').includes(plan.code)}
                          onCheckedChange={() => togglePlanInArray('available_for_plans', plan.code)}
                        />
                        <label
                          htmlFor={`available-${plan.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {plan.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Incluido gratis en</FormLabel>
                  <FormDescription>
                    Planes que incluyen este add-on sin coste adicional
                  </FormDescription>
                  <div className="space-y-2">
                    {plans?.map(plan => (
                      <div key={plan.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`included-${plan.id}`}
                          checked={form.watch('included_in_plans').includes(plan.code)}
                          onCheckedChange={() => togglePlanInArray('included_in_plans', plan.code)}
                        />
                        <label
                          htmlFor={`included-${plan.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {plan.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProduct.isPending || updatePrice.isPending || updateConfig.isPending}
              >
                {updateProduct.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
