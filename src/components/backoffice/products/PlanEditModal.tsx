// ============================================================
// IP-NEXUS BACKOFFICE - Plan Edit Modal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import {
  useProduct,
  useUpdateProduct,
  useCreateProduct,
  useProducts,
  useUpdateProductPrices,
  useUpdateProductFeatures,
  useUpdatePlanInclusions,
  type Product,
  type ProductPrice,
  type ProductFeature,
} from '@/hooks/backoffice';

const planSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Código requerido'),
  description: z.string().optional(),
  is_active: z.boolean(),
  is_popular: z.boolean(),
  sort_order: z.number(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanEditModalProps {
  plan?: Product;
  open: boolean;
  onClose: () => void;
}

export function PlanEditModal({ plan, open, onClose }: PlanEditModalProps) {
  const isEditing = !!plan;
  const { data: planDetails } = useProduct(plan?.id);
  const { data: allProducts } = useProducts();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const updatePrices = useUpdateProductPrices();
  const updateFeatures = useUpdateProductFeatures();
  const updateInclusions = useUpdatePlanInclusions();

  // Local state for prices, features, and inclusions
  const [prices, setPrices] = useState<Partial<ProductPrice>[]>([
    { billing_period: 'monthly', price: 0, currency: 'EUR', discount_percent: 0 },
    { billing_period: 'yearly', price: 0, currency: 'EUR', discount_percent: 20 },
  ]);
  const [features, setFeatures] = useState<Partial<ProductFeature>[]>([]);
  const [includedProductIds, setIncludedProductIds] = useState<string[]>([]);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
      is_popular: false,
      sort_order: 0,
    },
  });

  // Load existing data
  useEffect(() => {
    if (planDetails) {
      form.reset({
        name: planDetails.name,
        code: planDetails.code,
        description: planDetails.description ?? '',
        is_active: planDetails.is_active,
        is_popular: planDetails.is_popular,
        sort_order: planDetails.sort_order,
      });

      if (planDetails.prices.length > 0) {
        setPrices(planDetails.prices);
      }
      setFeatures(planDetails.features);
      setIncludedProductIds(
        planDetails.inclusions?.map(i => i.included_product_id) ?? []
      );
    }
  }, [planDetails, form]);

  const addonsAndModules = allProducts?.filter(
    p => p.product_type === 'addon' || p.product_type === 'module_standalone'
  ) ?? [];

  const handleSubmit = async (data: PlanFormData) => {
    try {
      let productId = plan?.id;

      if (isEditing && productId) {
        await updateProduct.mutateAsync({ id: productId, data });
      } else {
        const newProduct = await createProduct.mutateAsync({
          ...data,
          product_type: 'plan',
        });
        productId = newProduct.id;
      }

      if (productId) {
        // Update prices
        await updatePrices.mutateAsync({
          productId,
          prices: prices.map(p => ({
            ...p,
            product_id: productId,
          })),
        });

        // Update features
        await updateFeatures.mutateAsync({
          productId,
          features: features.map((f, i) => ({
            ...f,
            product_id: productId,
            sort_order: i,
          })),
        });

        // Update inclusions
        await updateInclusions.mutateAsync({
          planId: productId,
          includedProductIds,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      {
        feature_code: '',
        feature_name: '',
        limit_value: null,
        limit_unit: '',
        is_highlighted: false,
        sort_order: features.length,
      },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const toggleInclusion = (productId: string) => {
    setIncludedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar Plan: ${plan.name}` : 'Nuevo Plan'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="prices">Precios</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="inclusions">Inclusiones</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[50vh] mt-4 pr-4">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Professional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código (interno) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="plan_professional" 
                            {...field}
                            disabled={isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          Identificador único, no puede cambiarse después
                        </FormDescription>
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
                          <Textarea
                            placeholder="Para despachos en crecimiento..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Activo</FormLabel>
                            <FormDescription>
                              Visible para nuevas suscripciones
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

                    <FormField
                      control={form.control}
                      name="is_popular"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Destacado</FormLabel>
                            <FormDescription>
                              Mostrar como "Popular"
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
                  </div>

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orden</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Prices Tab */}
                <TabsContent value="prices" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel>Precio mensual *</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={prices.find(p => p.billing_period === 'monthly')?.price ?? 0}
                            onChange={e => {
                              const value = Number(e.target.value);
                              setPrices(prev => prev.map(p =>
                                p.billing_period === 'monthly' ? { ...p, price: value } : p
                              ));
                            }}
                          />
                          <span className="text-muted-foreground">€</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Precio anual *</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={prices.find(p => p.billing_period === 'yearly')?.price ?? 0}
                            onChange={e => {
                              const value = Number(e.target.value);
                              setPrices(prev => prev.map(p =>
                                p.billing_period === 'yearly' ? { ...p, price: value } : p
                              ));
                            }}
                          />
                          <span className="text-muted-foreground">€</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Equivale a {((prices.find(p => p.billing_period === 'yearly')?.price ?? 0) / 12).toFixed(2)}€/mes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Descuento anual (%)</FormLabel>
                      <Input
                        type="number"
                        value={prices.find(p => p.billing_period === 'yearly')?.discount_percent ?? 0}
                        onChange={e => {
                          const value = Number(e.target.value);
                          setPrices(prev => prev.map(p =>
                            p.billing_period === 'yearly' ? { ...p, discount_percent: value } : p
                          ));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Stripe Price IDs</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Mensual: price_..."
                          value={prices.find(p => p.billing_period === 'monthly')?.stripe_price_id ?? ''}
                          onChange={e => {
                            setPrices(prev => prev.map(p =>
                              p.billing_period === 'monthly' ? { ...p, stripe_price_id: e.target.value } : p
                            ));
                          }}
                        />
                        <Input
                          placeholder="Anual: price_..."
                          value={prices.find(p => p.billing_period === 'yearly')?.stripe_price_id ?? ''}
                          onChange={e => {
                            setPrices(prev => prev.map(p =>
                              p.billing_period === 'yearly' ? { ...p, stripe_price_id: e.target.value } : p
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-4">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        
                        <Input
                          placeholder="Nombre"
                          value={feature.feature_name ?? ''}
                          onChange={e => updateFeature(index, 'feature_name', e.target.value)}
                          className="flex-1"
                        />
                        
                        <Input
                          placeholder="Límite"
                          type="number"
                          value={feature.limit_value ?? ''}
                          onChange={e => updateFeature(index, 'limit_value', e.target.value ? Number(e.target.value) : null)}
                          className="w-24"
                        />
                        
                        <Input
                          placeholder="Unidad"
                          value={feature.limit_unit ?? ''}
                          onChange={e => updateFeature(index, 'limit_unit', e.target.value)}
                          className="w-28"
                        />

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={feature.is_highlighted ?? false}
                            onCheckedChange={v => updateFeature(index, 'is_highlighted', v)}
                          />
                          <span className="text-xs text-muted-foreground">Destacar</span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir feature
                  </Button>
                </TabsContent>

                {/* Inclusions Tab */}
                <TabsContent value="inclusions" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ¿Qué productos incluye este plan?
                  </p>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Módulos</h4>
                    {addonsAndModules
                      .filter(p => p.product_type === 'module_standalone' || p.module_code)
                      .map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={product.id}
                            checked={includedProductIds.includes(product.id)}
                            onCheckedChange={() => toggleInclusion(product.id)}
                          />
                          <label
                            htmlFor={product.id}
                            className="text-sm cursor-pointer"
                          >
                            {product.name}
                            {!includedProductIds.includes(product.id) && (
                              <span className="text-muted-foreground ml-2">
                                → Disponible como add-on
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Oficinas</h4>
                    {addonsAndModules
                      .filter(p => p.code.startsWith('addon_office_'))
                      .map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={product.id}
                            checked={includedProductIds.includes(product.id)}
                            onCheckedChange={() => toggleInclusion(product.id)}
                          />
                          <label
                            htmlFor={product.id}
                            className="text-sm cursor-pointer"
                          >
                            {product.name}
                            {!includedProductIds.includes(product.id) && (
                              <span className="text-muted-foreground ml-2">
                                → Disponible como add-on
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={updateProduct.isPending || createProduct.isPending}
              >
                {updateProduct.isPending || createProduct.isPending 
                  ? 'Guardando...' 
                  : 'Guardar cambios'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
