/**
 * Change Plan Dialog for Backoffice
 * Allows superadmins to change organization plans
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, Zap, Sparkles, Crown, Package } from 'lucide-react';
import { useSubscriptionPacks } from '@/hooks/use-subscription-packs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: { id: string; name: string; currentPlan: string } | null;
  onSuccess?: () => void;
}

export function ChangePlanDialog({ 
  open, 
  onOpenChange, 
  organization,
  onSuccess 
}: ChangePlanDialogProps) {
  const queryClient = useQueryClient();
  const { data: packs, isLoading: packsLoading } = useSubscriptionPacks();
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Reset selected pack when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && organization) {
      setSelectedPack(organization.currentPlan);
    }
    onOpenChange(open);
  };

  const { mutate: changePlan, isPending } = useMutation({
    mutationFn: async () => {
      if (!organization || !selectedPack) {
        throw new Error('Missing organization or plan');
      }

      const { data, error } = await supabase.rpc('admin_change_organization_plan', {
        p_organization_id: organization.id,
        p_pack_code: selectedPack,
        p_billing_cycle: billingCycle,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to change plan');
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Plan actualizado a ${selectedPack}`);
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getPackIcon = (packCode: string) => {
    switch (packCode) {
      case 'starter': return Zap;
      case 'professional': return Sparkles;
      case 'enterprise': return Crown;
      default: return Package;
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Organización</DialogTitle>
          <DialogDescription>
            Cambia el plan de suscripción para <strong>{organization.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Plan actual:</span>
            <Badge variant="outline">
              {organization.currentPlan?.charAt(0).toUpperCase() + organization.currentPlan?.slice(1)}
            </Badge>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <Label>Ciclo de facturación</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual (20% descuento)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Seleccionar nuevo plan</Label>
            {packsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <RadioGroup value={selectedPack} onValueChange={setSelectedPack} className="space-y-2">
                {packs?.filter(p => p.pack_type === 'bundle').map((pack) => {
                  const Icon = getPackIcon(pack.code);
                  const isCurrent = pack.code === organization.currentPlan;
                  const price = billingCycle === 'yearly' 
                    ? (pack.price_yearly || pack.price_monthly * 12) / 12 
                    : pack.price_monthly;
                  
                  return (
                    <div
                      key={pack.id}
                      className={cn(
                        "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all",
                        selectedPack === pack.code 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-muted-foreground/50"
                      )}
                      onClick={() => setSelectedPack(pack.code)}
                    >
                      <RadioGroupItem value={pack.code} id={pack.code} />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={pack.code} className="font-medium cursor-pointer">
                            {pack.name}
                          </Label>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px]">
                              Actual
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pack.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{price.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">/mes</p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => changePlan()}
            disabled={isPending || !selectedPack || selectedPack === organization.currentPlan}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Cambio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
