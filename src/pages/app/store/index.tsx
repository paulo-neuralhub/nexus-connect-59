/**
 * IP-NEXUS Store — Planes, Módulos y Add-ons
 * Silk v2 Design System
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Check, X, CheckCircle2, Minus, Users,
  ShoppingBag, Monitor, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LucideDynamicIcon } from "@/components/ui/lucide-dynamic-icon";
import { useAddonStore, type BillingAddon } from "@/hooks/use-addon-store";
import { cn } from "@/lib/utils";

// ── Static Data ─────────────────────────────────────────
const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-indigo-100 text-indigo-700",
  enterprise: "bg-slate-900 text-amber-400",
};

const PLAN_COLORS: Record<string, string> = {
  free: "#94A3B8",
  starter: "#3B82F6",
  professional: "#6366F1",
  enterprise: "#0F172A",
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_ORDER = ["free", "starter", "professional", "enterprise"] as const;

const PLAN_FEATURES: Record<string, {
  matters: number; users: number; jurisdictions: number;
  storage_gb: number; genius_queries: number;
  modules: Record<string, boolean>;
}> = {
  free: {
    matters: 25, users: 2, jurisdictions: 1, storage_gb: 1, genius_queries: 25,
    modules: { docketing: true, deadlines: true, documents: false, crm: false, spider: false, finance: false, genius: false, portal: false, api: false, sso: false },
  },
  starter: {
    matters: 150, users: 2, jurisdictions: 5, storage_gb: 10, genius_queries: 200,
    modules: { docketing: true, deadlines: true, documents: true, crm: false, spider: false, finance: false, genius: true, portal: true, api: false, sso: false },
  },
  professional: {
    matters: 3000, users: 15, jurisdictions: 15, storage_gb: 50, genius_queries: 500,
    modules: { docketing: true, deadlines: true, documents: true, crm: true, spider: true, finance: true, genius: true, portal: true, api: false, sso: false },
  },
  enterprise: {
    matters: -1, users: -1, jurisdictions: -1, storage_gb: 500, genius_queries: -1,
    modules: { docketing: true, deadlines: true, documents: true, crm: true, spider: true, finance: true, genius: true, portal: true, api: true, sso: true },
  },
};

const MODULE_LABELS: Record<string, string> = {
  docketing: "Docketing IP",
  deadlines: "Gestión de Plazos",
  documents: "Documentos",
  crm: "CRM Completo",
  spider: "IP-SPIDER Vigilancia",
  finance: "Finanzas y Facturación",
  genius: "IP-GENIUS IA",
  portal: "Portal Clientes",
  api: "Acceso API",
  sso: "SSO Enterprise",
};

const ADDON_CATEGORY_LABELS: Record<string, string> = {
  all: "Todos",
  intelligence: "Inteligencia",
  jurisdiction_pack: "Jurisdicciones",
  module_standalone: "Módulos",
  automation: "Automatización",
  capacity: "Capacidad",
  storage: "Almacenamiento",
  users: "Usuarios",
  accounting: "Contabilidad",
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  intelligence: { label: "Inteligencia IP", icon: "BarChart3", color: "#8B5CF6" },
  jurisdiction_pack: { label: "Jurisdicciones", icon: "Globe", color: "#3B82F6" },
  module_standalone: { label: "Módulos", icon: "Package", color: "#0EA5E9" },
  automation: { label: "Automatización", icon: "RefreshCw", color: "#F59E0B" },
  capacity: { label: "Capacidad", icon: "FolderPlus", color: "#64748B" },
  storage: { label: "Almacenamiento", icon: "HardDrive", color: "#64748B" },
  users: { label: "Usuarios", icon: "UserPlus", color: "#6366F1" },
  accounting: { label: "Contabilidad", icon: "Calculator", color: "#14B8A6" },
};

const CATEGORY_ORDER = [
  "intelligence", "jurisdiction_pack", "module_standalone", "automation",
  "capacity", "storage", "users", "accounting",
];

const ADDON_GROUPS: { label: string; categories: string[]; icon: string; color: string }[] = [
  { label: "Módulos y servicios", categories: ["module_standalone", "automation", "intelligence"], icon: "Package", color: "#0EA5E9" },
  { label: "Capacidad y cobertura", categories: ["jurisdiction_pack", "capacity", "storage", "users", "accounting"], icon: "Layers", color: "#10B981" },
];

// Plan static prices (fallback if plan_definitions not loaded)
const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 49, annual: 39 },
  professional: { monthly: 149, annual: 119 },
  enterprise: { monthly: 399, annual: 319 },
};

const PLAN_INCLUDED_MODULES: Record<string, Record<string, boolean>> = {
  free: { "Docketing IP": true, "Gestión de Plazos": true, Documentos: false, "CRM Completo": false, "IP-SPIDER Vigilancia": false, "Finanzas y Facturación": false, "IP-GENIUS IA": false, "Portal Clientes": false, "Acceso API": false, "SSO Enterprise": false },
  starter: { "Docketing IP": true, "Gestión de Plazos": true, Documentos: true, "CRM Completo": false, "IP-SPIDER Vigilancia": false, "Finanzas y Facturación": false, "IP-GENIUS IA": true, "Portal Clientes": true, "Acceso API": false, "SSO Enterprise": false },
  professional: { "Docketing IP": true, "Gestión de Plazos": true, Documentos: true, "CRM Completo": true, "IP-SPIDER Vigilancia": true, "Finanzas y Facturación": true, "IP-GENIUS IA": true, "Portal Clientes": true, "Acceso API": false, "SSO Enterprise": false },
  enterprise: { "Docketing IP": true, "Gestión de Plazos": true, Documentos: true, "CRM Completo": true, "IP-SPIDER Vigilancia": true, "Finanzas y Facturación": true, "IP-GENIUS IA": true, "Portal Clientes": true, "Acceso API": true, "SSO Enterprise": true },
};

const MODULE_ICONS: Record<string, string> = {
  "Docketing IP": "FileText",
  "Gestión de Plazos": "Clock",
  Documentos: "FolderOpen",
  "CRM Completo": "Users",
  "IP-SPIDER Vigilancia": "Eye",
  "Finanzas y Facturación": "DollarSign",
  "IP-GENIUS IA": "Sparkles",
  "Portal Clientes": "Globe",
  "Acceso API": "Code",
  "SSO Enterprise": "Shield",
};

// ── Silk shadow constants ───────────────────────────────
const SILK_SHADOW = "4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff";
const SILK_SHADOW_SM = "2px 2px 6px #cdd1dc, -2px -2px 6px #ffffff";

// ── Component ───────────────────────────────────────────
export default function AddonStorePage() {
  const navigate = useNavigate();
  const { addons, orgPlan, activeAddons, isLoading, error, getAddonState } = useAddonStore();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [cart, setCart] = useState<BillingAddon[]>([]);
  const [mainTab, setMainTab] = useState("plan");
  const [addonTab, setAddonTab] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const planCode = orgPlan?.plan_code ?? "free";
  const badgeClass = PLAN_BADGE[planCode] ?? PLAN_BADGE.free;

  // Cart helpers
  const addToCart = (addon: BillingAddon) => {
    if (getAddonState(addon) !== "available") return;
    setCart((prev) => prev.some((a) => a.code === addon.code) ? prev : [...prev, addon]);
  };
  const removeFromCart = (code: string) => {
    setCart((prev) => prev.filter((a) => a.code !== code));
  };
  const cartCodes = useMemo(() => new Set(cart.map((a) => a.code)), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, a) => sum + (billingCycle === "monthly" ? a.price_monthly_eur : a.price_annual_eur), 0),
    [cart, billingCycle]
  );

  // Addon filtering — use getAddonState for counts
  const availableCount = (category: string) =>
    addons.filter((a) =>
      (category === "all" || a.category === category) &&
      getAddonState(a) === "available"
    ).length;

  const filteredAddons = addons.filter((a) => {
    const state = getAddonState(a);
    if (state === "active") return false; // shown in active section
    return addonTab === "all" || a.category === addonTab;
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    addons.forEach((a) => {
      const state = getAddonState(a);
      if (state === "active") return;
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [addons, getAddonState]);

  // Render a single addon card based on state
  const renderAddonCard = (addon: BillingAddon) => {
    const state = getAddonState(addon);
    const inCart = cartCodes.has(addon.code);
    const displayPrice = billingCycle === "monthly" ? addon.price_monthly_eur : addon.price_annual_eur;
    const annualSaving = (addon.price_monthly_eur - addon.price_annual_eur) * 12;

    if (state === "active") {
      return (
        <div
          key={addon.code}
          className="flex items-center gap-3 p-3 rounded-[14px] bg-white border-l-4"
          style={{ borderLeftColor: addon.color_hex ?? "#64748B", backgroundColor: (addon.color_hex ?? "#64748B") + "0D" }}
        >
          <LucideDynamicIcon name={addon.icon_name} fallback={<Package className="h-4 w-4" />} size={16} color={addon.color_hex ?? "#64748B"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{addon.name_es}</p>
            <p className="text-xs text-green-600">✓ Activo · Incluido</p>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">Incluido</Badge>
        </div>
      );
    }

    if (state === "redundant") {
      return (
        <div key={addon.code} id={addon.code} className="bg-white rounded-[14px] p-4 flex flex-col opacity-70 cursor-default" style={{ boxShadow: SILK_SHADOW_SM }}>
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs w-fit mb-2 px-2 py-0.5 rounded-full">Ya incluido</Badge>
          <LucideDynamicIcon name={addon.icon_name} fallback={<Package className="h-[18px] w-[18px]" />} size={18} color="#94A3B8" className="mb-2" />
          <p className="text-sm font-semibold text-slate-400 mt-1">{addon.name_es}</p>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 flex-1">{addon.description_es}</p>
          <p className="text-xs text-slate-400 mt-3 italic">Cubierto por tu plan o por otro add-on activo.</p>
        </div>
      );
    }

    if (state === "incompatible") {
      return (
        <div key={addon.code} id={addon.code} className="bg-white rounded-[14px] p-4 flex flex-col opacity-50 cursor-not-allowed" style={{ boxShadow: SILK_SHADOW_SM }}>
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs w-fit mb-2">Requiere plan superior</Badge>
          <LucideDynamicIcon name={addon.icon_name} fallback={<Package className="h-[18px] w-[18px]" />} size={18} color="#94A3B8" />
          <p className="text-sm font-semibold text-slate-400 mt-2">{addon.name_es}</p>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 flex-1">{addon.description_es}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={() => setMainTab("plan")}>Ver planes</Button>
        </div>
      );
    }

    // state === "available"
    return (
      <div key={addon.code} id={addon.code} className="bg-white rounded-[14px] p-4 flex flex-col hover:-translate-y-0.5 duration-200 cursor-pointer" style={{ boxShadow: SILK_SHADOW }}>
        <div className="flex justify-between items-start">
          <LucideDynamicIcon name={addon.icon_name} fallback={<Package className="h-[18px] w-[18px]" />} size={18} color={addon.color_hex ?? "#64748B"} />
          {inCart && <Badge className="bg-blue-100 text-blue-700 text-xs">En carrito</Badge>}
        </div>
        <p className="text-sm font-semibold text-slate-800 mt-2">{addon.name_es}</p>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex-1">{addon.description_es}</p>
        <div className="mt-3 flex justify-between items-end">
          <div>
            <p className="text-base font-bold text-slate-800">€{displayPrice}<span className="text-xs font-normal text-slate-500">/mes{billingCycle === "annual" ? " anual" : ""}</span></p>
            {billingCycle === "annual" && annualSaving > 0 && <p className="text-xs text-green-600">Ahorra €{annualSaving}/año</p>}
          </div>
          {inCart ? (
            <Button variant="outline" size="sm" className="text-red-500 border-red-200 text-xs" onClick={() => removeFromCart(addon.code)}>Quitar</Button>
          ) : (
            <Button size="sm" className="text-xs text-white" style={{ backgroundColor: addon.color_hex ?? "#64748B" }} onClick={() => addToCart(addon)}>Añadir</Button>
          )}
        </div>
      </div>
    );
  };

  const currentPlanTier = PLAN_ORDER.indexOf(planCode as any);

  // ── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen space-y-6" style={{ background: "#EEF2F7" }}>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-[14px]" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 min-h-screen" style={{ background: "#EEF2F7" }}>
        <div className="bg-red-50 border border-red-200 rounded-[14px] p-6 text-center text-sm text-red-700">
          Error cargando el catálogo. Por favor recarga la página.
        </div>
      </div>
    );
  }

  const planMonthly = orgPlan?.monthly_price_eur ?? 0;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#EEF2F7" }}>
      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">IP-NEXUS Store</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Planes, módulos y add-ons para tu despacho
          </p>
        </div>
        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full uppercase", badgeClass)}>
          {orgPlan?.plan_name ?? "Free"}
        </span>
      </div>

      {/* ── MAIN TABS ──────────────────────────────── */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="plan">Mi Plan</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Mi Plan ═══════════════════════ */}
        <TabsContent value="plan">
          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {PLAN_ORDER.map((pCode) => {
              const feat = PLAN_FEATURES[pCode];
              const prices = PLAN_PRICES[pCode];
              const isCurrent = pCode === planCode;
              const planTier = PLAN_ORDER.indexOf(pCode);
              const color = PLAN_COLORS[pCode];
              const price = billingCycle === "monthly" ? prices.monthly : prices.annual;

              return (
                <div
                  key={pCode}
                  className={cn(
                    "bg-white rounded-[14px] p-5 relative flex flex-col",
                    isCurrent ? "border-2" : "border border-transparent"
                  )}
                  style={{
                    boxShadow: SILK_SHADOW,
                    borderColor: isCurrent ? color : undefined,
                  }}
                >
                  {isCurrent && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 rounded-full font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: color }}
                    >
                      Tu plan actual
                    </span>
                  )}
                  {pCode === "enterprise" && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                      Más completo
                    </span>
                  )}

                  <p className="text-xl font-bold text-slate-800 mt-4">{PLAN_NAMES[pCode]}</p>

                  {pCode === "free" ? (
                    <p className="text-2xl font-bold text-slate-800 mt-2">Gratis</p>
                  ) : (
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-slate-800">€{price}</span>
                      <span className="text-sm text-slate-500">/mes</span>
                      {billingCycle === "annual" && (
                        <p className="text-xs text-slate-400 mt-0.5">Facturado anualmente</p>
                      )}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="text-sm text-slate-600 space-y-1">
                    <p>· {feat.matters === -1 ? "Ilimitados" : feat.matters} expedientes</p>
                    <p>· {feat.users === -1 ? "Ilimitados" : feat.users} usuarios</p>
                    <p>· {feat.jurisdictions === -1 ? "Ilimitadas" : feat.jurisdictions} jurisdicciones</p>
                    <p>· {feat.storage_gb} GB almacenamiento</p>
                    <p>· {feat.genius_queries === -1 ? "Ilimitadas" : feat.genius_queries} consultas IA/mes</p>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-1.5 flex-1">
                    {Object.keys(MODULE_LABELS).map((mk) => (
                      <div key={mk} className="flex items-center gap-2 text-sm">
                        {feat.modules[mk]
                          ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          : <X className="h-4 w-4 text-slate-300 flex-shrink-0" />}
                        <span className={feat.modules[mk] ? "text-slate-700" : "text-slate-400"}>
                          {MODULE_LABELS[mk]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    {isCurrent ? (
                      <Button disabled variant="outline" className="w-full">Plan actual</Button>
                    ) : planTier > currentPlanTier ? (
                      <Button
                        className="w-full bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => setSelectedPlan(pCode)}
                      >
                        Actualizar a {PLAN_NAMES[pCode]}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full text-slate-500"
                        onClick={() => setSelectedPlan(pCode)}
                      >
                        Cambiar a {PLAN_NAMES[pCode]}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ TAB 2: Módulos ═══════════════════════ */}
        <TabsContent value="modules">
          {/* Mobile fallback */}
          <div className="md:hidden mt-4">
            <div className="bg-white rounded-[14px] p-5 text-center text-sm text-slate-500" style={{ boxShadow: SILK_SHADOW }}>
              <Monitor className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              La comparativa de módulos está optimizada para desktop.
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block mt-4">
            <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

            <div className="bg-white rounded-[14px] overflow-hidden mt-4" style={{ boxShadow: SILK_SHADOW }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 text-slate-500 font-medium">Módulo</th>
                    {PLAN_ORDER.map((pCode) => {
                      const isCurrent = pCode === planCode;
                      const prices = PLAN_PRICES[pCode];
                      const price = billingCycle === "monthly" ? prices.monthly : prices.annual;
                      return (
                        <th key={pCode} className="p-4 text-center">
                          {isCurrent && (
                            <span className="inline-block text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold mb-1">
                              Actual
                            </span>
                          )}
                          <p className="font-bold text-slate-800">{PLAN_NAMES[pCode]}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pCode === "free" ? "Gratis" : `€${price}/mes`}
                          </p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(MODULE_LABELS).map((mk, idx) => (
                    <tr key={mk} className={idx % 2 === 0 ? "bg-slate-50/50" : ""}>
                      <td className="p-4 text-slate-700 font-medium">{MODULE_LABELS[mk]}</td>
                      {PLAN_ORDER.map((pCode) => (
                        <td key={pCode} className="p-4 text-center">
                          {PLAN_FEATURES[pCode].modules[mk]
                            ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            : <Minus className="h-5 w-5 text-slate-300 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="mt-6 bg-white rounded-[14px] p-5 flex items-center justify-between"
              style={{ boxShadow: SILK_SHADOW }}
            >
              <p className="text-sm text-slate-600">
                ¿Necesitas un módulo que no tienes? Actualiza tu plan o explora los Add-ons disponibles.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setMainTab("plan")}>
                  Ver planes
                </Button>
                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setMainTab("addons")}>
                  Ver Add-ons
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ TAB 3: Add-ons ══════════════════════ */}
        <TabsContent value="addons">
          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

          <div className={cn("mt-4", cart.length > 0 ? "flex gap-6" : "")}>
            <div className="flex-1 min-w-0">
               {/* Included in subscription */}
              <div className="mb-8">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Incluido en tu suscripción</p>

                <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-4 items-start">
                  {/* ══ COLUMNA IZQUIERDA: PLAN ══ */}
                  <div className="bg-slate-50 rounded-[14px] p-4 border border-slate-200" style={{ boxShadow: SILK_SHADOW }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <LucideDynamicIcon name="Shield" size={13} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{orgPlan?.plan_name ?? "Plan"}</p>
                        <p className="text-xs text-slate-400">Plan base</p>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-white font-medium flex-shrink-0">Activo</span>
                    </div>

                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-xl font-bold text-slate-800">
                        {(orgPlan?.monthly_price_eur ?? 0) === 0 ? "Gratis" : `€${billingCycle === "monthly" ? orgPlan?.monthly_price_eur : orgPlan?.annual_price_eur}`}
                      </span>
                      {(orgPlan?.monthly_price_eur ?? 0) > 0 && <span className="text-xs text-slate-400">/mes</span>}
                    </div>

                    <div className="flex gap-2 pb-3 mb-3 border-b border-slate-200">
                      {[
                        { label: "Exp.", value: (orgPlan?.max_matters ?? 0) >= 999999 ? "∞" : String(orgPlan?.max_matters ?? "—") },
                        { label: "Us.", value: (orgPlan?.max_users ?? 0) >= 999999 ? "∞" : String(orgPlan?.max_users ?? "—") },
                        { label: "Jur.", value: (orgPlan?.max_jurisdictions ?? 0) === -1 ? "∞" : String(orgPlan?.max_jurisdictions ?? "—") },
                      ].map((m) => (
                        <div key={m.label} className="flex-1 text-center">
                          <p className="text-sm font-bold text-slate-800">{m.value}</p>
                          <p className="text-xs text-slate-400">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {Object.entries(PLAN_INCLUDED_MODULES[planCode] ?? {})
                        .filter(([, inc]) => inc)
                        .map(([mod]) => (
                          <span key={mod} className="inline-flex items-center gap-0.5 text-xs text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 leading-tight">
                            <LucideDynamicIcon name={MODULE_ICONS[mod] ?? "Check"} size={8} color="#16a34a" />
                            {mod}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* ══ COLUMNA DERECHA: ADD-ONS ══ */}
                  <div className="bg-white rounded-[14px] p-4 border border-green-200" style={{ boxShadow: SILK_SHADOW }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                          <LucideDynamicIcon name="Plus" size={13} color="white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">Add-ons</p>
                          <p className="text-xs text-slate-400">Contratados y disponibles</p>
                        </div>
                      </div>
                      {activeAddons.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium border border-green-200 flex-shrink-0">
                          {activeAddons.length} activo{activeAddons.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-5">
                      {ADDON_GROUPS.map((group) => {
                        const groupAddons = addons.filter((a) => {
                          const state = getAddonState(a);
                          return group.categories.includes(a.category) && state !== "incompatible";
                        });
                        if (groupAddons.length === 0) return null;
                        return (
                          <div key={group.label}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <LucideDynamicIcon name={group.icon} size={10} color={group.color} />
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: group.color }}>{group.label}</p>
                              <span className="text-xs text-slate-400">({groupAddons.filter((a) => getAddonState(a) === "active").length} activos)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {groupAddons.map((addon) => {
                                const state = getAddonState(addon);
                                const isActive = state === "active";
                                const isRedundant = state === "redundant";
                                const isAvailable = state === "available";
                                const isInCart = cart.some((c) => c.code === addon.code);
                                const color = addon.color_hex ?? "#64748B";
                                return (
                                  <div
                                    key={addon.code}
                                    className={cn(
                                      "relative flex flex-col items-start gap-1.5 p-2 rounded-xl border transition-all duration-150",
                                      isAvailable && !isInCart ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
                                    )}
                                    style={{
                                      backgroundColor: isActive ? color + "12" : isInCart ? "#EFF6FF" : "#F8FAFC",
                                      borderColor: isActive ? color + "40" : isInCart ? "#BFDBFE" : "#E2E8F0",
                                      opacity: isRedundant ? 0.5 : 1,
                                    }}
                                    onClick={() => { if (isAvailable && !isInCart) addToCart(addon); }}
                                  >
                                    {/* Badge estado top-right */}
                                    <div className="absolute top-1.5 right-1.5">
                                      {isActive && (
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                                          <LucideDynamicIcon name="Check" size={8} color="white" />
                                        </div>
                                      )}
                                      {isAvailable && !isInCart && (
                                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center hover:bg-green-100">
                                          <LucideDynamicIcon name="Plus" size={8} color="#64748B" />
                                        </div>
                                      )}
                                      {isInCart && (
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                          <LucideDynamicIcon name="ShoppingCart" size={8} color="#3B82F6" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: isActive ? color + "25" : "#E2E8F0" }}>
                                      <LucideDynamicIcon name={addon.icon_name ?? "Package"} size={12} color={isActive ? color : "#94A3B8"} />
                                    </div>
                                    <p className={cn("text-xs font-medium leading-tight pr-4", isActive ? "text-slate-700" : isInCart ? "text-blue-700" : "text-slate-400")}>
                                      {addon.name_es}
                                    </p>
                                    {isAvailable && !isInCart && (
                                      <p className="text-xs text-slate-400">€{billingCycle === "monthly" ? addon.price_monthly_eur : addon.price_annual_eur}/mes</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Nota explicativa */}
                <div className="flex items-start gap-2 mt-3 px-1">
                  <LucideDynamicIcon name="Info" size={12} color="#94A3B8" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-500">Plan base</span> funcionalidades incluidas sin coste adicional.{" "}
                    <span className="font-semibold text-slate-500">Add-ons</span> módulos extra facturados adicionalmente. Haz clic en <span className="font-medium">+</span> para añadir al carrito.
                  </p>
                </div>
              </div>

              {/* Category tabs */}
              <Tabs value={addonTab} onValueChange={setAddonTab}>
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="all">Todos({availableCount("all")})</TabsTrigger>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    ADDON_CATEGORY_LABELS[cat] ? (
                      <TabsTrigger key={cat} value={cat}>
                        {ADDON_CATEGORY_LABELS[cat]}({count})
                      </TabsTrigger>
                    ) : null
                  ))}
                </TabsList>
              </Tabs>

              {/* Addon grid — grouped when "all", flat otherwise */}
              <div className="mt-4">
                {addonTab === "all" ? (
                  <div className="space-y-10">
                    {CATEGORY_ORDER.map((category) => {
                      const categoryAddons = addons.filter((a) => a.category === category);
                      if (categoryAddons.length === 0) return null;

                      const config = CATEGORY_CONFIG[category];
                      const activeCount = categoryAddons.filter((a) => getAddonState(a) === "active").length;
                      const avail = categoryAddons.filter((a) => getAddonState(a) === "available").length;
                      const redundant = categoryAddons.filter((a) => getAddonState(a) === "redundant").length;

                      const parts: string[] = [];
                      if (activeCount > 0) parts.push(`${activeCount} activo${activeCount > 1 ? "s" : ""}`);
                      if (redundant > 0) parts.push(`${redundant} incluido${redundant > 1 ? "s" : ""}`);
                      if (avail > 0) parts.push(`${avail} disponible${avail > 1 ? "s" : ""}`);

                      return (
                        <div key={category}>
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: config.color + "20" }}
                            >
                              <LucideDynamicIcon name={config.icon} fallback={<Package className="h-4 w-4" />} size={16} color={config.color} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-slate-700 leading-tight">{config.label}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">{parts.join(" · ") || "Sin add-ons"}</p>
                            </div>
                            <div className="h-px flex-1 bg-slate-200 ml-2 hidden sm:block" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {categoryAddons.map((addon) => renderAddonCard(addon))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {addons.filter((a) => a.category === addonTab).map((addon) => renderAddonCard(addon))}
                    </div>
                    {addons.filter((a) => a.category === addonTab).length === 0 && (
                      <p className="text-center py-12 text-slate-400 text-sm">No hay add-ons en esta categoría.</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── CART PANEL ────────────────────────── */}
            {cart.length > 0 && (
              <aside className="w-80 flex-shrink-0 sticky top-6 self-start">
                <div className="bg-white rounded-[14px] overflow-hidden" style={{ boxShadow: SILK_SHADOW }}>
                  {/* Header */}
                  <div className="flex justify-between items-center px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-700">Tu selección</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{cart.length}</Badge>
                  </div>

                  {/* Plan actual section */}
                  <div className="mx-5 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Plan actual</p>
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-semibold text-slate-700">
                        {orgPlan?.plan_name ?? "Free"} · {billingCycle === "annual" ? "Anual" : "Mensual"}
                      </p>
                      <span className="text-sm font-bold text-slate-800">€{planMonthly}/mes</span>
                    </div>
                  </div>

                  {/* Add-ons seleccionados */}
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Add-ons seleccionados
                    </p>
                    <div className="space-y-2.5">
                      {cart.map((addon) => {
                        const addonPrice = billingCycle === "monthly" ? addon.price_monthly_eur : addon.price_annual_eur;
                        return (
                          <div key={addon.code} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2 min-w-0">
                              <LucideDynamicIcon
                                name={addon.icon_name}
                                fallback={<Package className="h-3.5 w-3.5" />}
                                size={14}
                                color={addon.color_hex ?? "#64748B"}
                              />
                              <span className="text-sm text-slate-700 truncate">{addon.name_es}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm text-slate-600">€{addonPrice}/mes</span>
                              <button
                                onClick={() => removeFromCart(addon.code)}
                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label={`Quitar ${addon.name_es}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen financiero */}
                  <div className="mx-5 mt-3 mb-4 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Plan:</span>
                      <span>€{planMonthly}/mes</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Add-ons (+{cart.length}):</span>
                      <span>+€{cartTotal}/mes</span>
                    </div>
                    <Separator className="!my-2" />
                    <div className="flex justify-between font-bold text-slate-800 text-base">
                      <span>TOTAL</span>
                      <span>€{(planMonthly + cartTotal).toLocaleString("es-ES")}/mes</span>
                    </div>
                    {billingCycle === "annual" && (
                      <p className="text-xs text-slate-400 text-right">
                        €{((planMonthly + cartTotal) * 12).toLocaleString("es-ES")}/año
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <Button
                      className="w-full bg-slate-900 text-white hover:bg-slate-800"
                      size="sm"
                      onClick={() => {
                        const subject = encodeURIComponent("Solicitud Add-ons IP-NEXUS");
                        const body = encodeURIComponent(
                          "Plan actual: " + (orgPlan?.plan_name ?? "Free") + "\n" +
                          "Ciclo: " + (billingCycle === "annual" ? "Anual" : "Mensual") + "\n\n" +
                          "Add-ons solicitados:\n" +
                          cart.map((a) =>
                            "- " + a.name_es + ": €" +
                            (billingCycle === "monthly" ? a.price_monthly_eur : a.price_annual_eur) + "/mes"
                          ).join("\n") + "\n\n" +
                          "Total adicional: €" + cartTotal + "/mes"
                        );
                        window.open("mailto:ventas@ip-nexus.com?subject=" + subject + "&body=" + body, "_blank");
                      }}
                    >
                      Proceder al pago →
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <Lock className="h-3 w-3 text-slate-400" />
                      <p className="text-[11px] text-slate-400">
                        Pago seguro con Stripe
                      </p>
                    </div>
                    <p className="text-[11px] text-center text-slate-400 mt-0.5">
                      Cancela cuando quieras
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── UPGRADE MODAL ────────────────────────────── */}
      <Dialog open={selectedPlan !== null} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle>Actualizar a {PLAN_NAMES[selectedPlan]}</DialogTitle>
                <DialogDescription>
                  {selectedPlan === "free"
                    ? "Gratis"
                    : `€${billingCycle === "monthly" ? PLAN_PRICES[selectedPlan].monthly : PLAN_PRICES[selectedPlan].annual}/mes${billingCycle === "annual" ? " (anual)" : ""}`
                  }
                </DialogDescription>
              </DialogHeader>

              {/* Unlocked modules */}
              {(() => {
                const newModules = Object.keys(MODULE_LABELS).filter(
                  (k) => PLAN_FEATURES[selectedPlan]?.modules[k] && !PLAN_FEATURES[planCode]?.modules[k]
                );
                if (newModules.length === 0) return null;
                return (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-slate-700 mb-2">Lo que desbloqueas:</p>
                    <div className="space-y-1.5">
                      {newModules.map((k) => (
                        <div key={k} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {MODULE_LABELS[k]}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <Separator className="my-3" />

              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  const subject = encodeURIComponent("Solicitud upgrade a " + PLAN_NAMES[selectedPlan]);
                  const body = encodeURIComponent(
                    "Plan actual: " + (orgPlan?.plan_name ?? "Free") + "\n" +
                    "Plan solicitado: " + PLAN_NAMES[selectedPlan] + "\n" +
                    "Ciclo: " + (billingCycle === "annual" ? "Anual" : "Mensual")
                  );
                  window.open("mailto:ventas@ip-nexus.com?subject=" + subject + "&body=" + body, "_blank");
                }}
              >
                Solicitar cambio de plan
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => setSelectedPlan(null)}>
                Cancelar
              </Button>
              <p className="text-[11px] text-center text-slate-400 mt-1">
                Activación en menos de 24h laborables
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Billing Cycle Toggle ──────────────────────────────
function BillingCycleToggle({
  value,
  onChange,
}: {
  value: "monthly" | "annual";
  onChange: (v: "monthly" | "annual") => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <span className={cn("text-sm", value === "monthly" ? "font-semibold text-slate-800" : "text-slate-500")}>
        Mensual
      </span>
      <Switch
        checked={value === "annual"}
        onCheckedChange={(checked) => onChange(checked ? "annual" : "monthly")}
      />
      <span className={cn("text-sm", value === "annual" ? "font-semibold text-slate-800" : "text-slate-500")}>
        Anual
      </span>
      <Badge className="bg-green-100 text-green-700 text-xs">Ahorra 20%</Badge>
    </div>
  );
}
