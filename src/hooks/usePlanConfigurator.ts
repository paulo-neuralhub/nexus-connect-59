import { useState, useMemo, useCallback } from 'react';
import { useBillingPlans, useBillingAddons, type BillingPlan, type BillingAddon } from './useBillingData';
import { useBillingLimits } from './useBillingLimits';

export interface SelectedAddon {
  code: string;
  quantity: number;
}

export interface ConfiguratorState {
  selectedPlanCode: string;
  billingCycle: 'monthly' | 'annual';
  selectedAddons: SelectedAddon[];
  totalMonthly: number;
  totalAnnual: number;
  annualSavings: number;
}

export function usePlanConfigurator() {
  const { data: plans = [] } = useBillingPlans();
  const { data: addons = [] } = useBillingAddons();
  const { flags } = useBillingLimits();

  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(flags?.current_plan_code || 'starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>((flags?.current_billing_cycle as any) || 'monthly');
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Initialize from current tenant flags
  useMemo(() => {
    if (flags?.current_plan_code && selectedPlanCode === 'starter') {
      setSelectedPlanCode(flags.current_plan_code);
    }
    if (flags?.current_billing_cycle) {
      setBillingCycle(flags.current_billing_cycle as 'monthly' | 'annual');
    }
    if (flags?.current_addons && Array.isArray(flags.current_addons) && flags.current_addons.length > 0) {
      setSelectedAddons(flags.current_addons.map((a: any) => ({ code: a.code, quantity: a.quantity || 1 })));
    }
  }, [flags?.current_plan_code]);

  const selectedPlan = useMemo(() => plans.find(p => p.code === selectedPlanCode), [plans, selectedPlanCode]);

  const isModuleIncluded = useCallback((moduleCode: string) => {
    return selectedPlan?.included_modules.includes(moduleCode) ?? false;
  }, [selectedPlan]);

  const toggleAddon = useCallback((code: string) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.code === code);
      if (exists) return prev.filter(a => a.code !== code);
      return [...prev, { code, quantity: 1 }];
    });
  }, []);

  const setAddonQuantity = useCallback((code: string, quantity: number) => {
    setSelectedAddons(prev => {
      if (quantity <= 0) return prev.filter(a => a.code !== code);
      const exists = prev.find(a => a.code === code);
      if (exists) return prev.map(a => a.code === code ? { ...a, quantity } : a);
      return [...prev, { code, quantity }];
    });
  }, []);

  const hasAddon = useCallback((code: string) => {
    return selectedAddons.some(a => a.code === code);
  }, [selectedAddons]);

  const { totalMonthly, totalAnnual, annualSavings, lineItems } = useMemo(() => {
    if (!selectedPlan) return { totalMonthly: 0, totalAnnual: 0, annualSavings: 0, lineItems: [] };

    const items: Array<{ name: string; monthlyPrice: number; annualPrice: number; included: boolean }> = [];

    items.push({
      name: selectedPlan.name_es,
      monthlyPrice: Number(selectedPlan.price_monthly_eur),
      annualPrice: Number(selectedPlan.price_annual_eur),
      included: false,
    });

    for (const sa of selectedAddons) {
      const addon = addons.find(a => a.code === sa.code);
      if (!addon) continue;
      // Skip if included in plan
      if (addon.module_code && selectedPlan.included_modules.includes(addon.module_code)) continue;
      items.push({
        name: addon.name_es + (sa.quantity > 1 ? ` ×${sa.quantity}` : ''),
        monthlyPrice: Number(addon.price_monthly_eur) * sa.quantity,
        annualPrice: Number(addon.price_annual_eur) * sa.quantity,
        included: false,
      });
    }

    const totalMonthly = items.reduce((s, i) => s + i.monthlyPrice, 0);
    const totalAnnual = items.reduce((s, i) => s + i.annualPrice, 0);
    const annualSavings = (totalMonthly - totalAnnual) * 12;

    return { totalMonthly, totalAnnual, annualSavings, lineItems: items };
  }, [selectedPlan, selectedAddons, addons]);

  return {
    plans,
    addons,
    selectedPlanCode,
    setSelectedPlanCode,
    billingCycle,
    setBillingCycle,
    selectedAddons,
    setSelectedAddons,
    toggleAddon,
    setAddonQuantity,
    hasAddon,
    isModuleIncluded,
    selectedPlan,
    totalMonthly,
    totalAnnual,
    annualSavings,
    lineItems,
    currentPlanCode: flags?.current_plan_code || null,
  };
}
