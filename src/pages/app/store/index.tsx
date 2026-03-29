/**
 * IP-NEXUS Add-on Store — Catálogo de complementos
 * Silk v2 Design System
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LucideDynamicIcon } from "@/components/ui/lucide-dynamic-icon";
import { useAddonStore, type BillingAddon } from "@/hooks/use-addon-store";
import { cn } from "@/lib/utils";

// ── Plan badge colors ──────────────────────────────────
const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-indigo-100 text-indigo-700",
  enterprise: "bg-slate-900 text-amber-400",
};

// ── Tab definitions ────────────────────────────────────
const TABS = [
  { value: "all", label: "Todos" },
  { value: "intelligence", label: "Inteligencia" },
  { value: "jurisdiction_pack", label: "Jurisdicciones" },
  { value: "module_standalone", label: "Módulos" },
  { value: "automation", label: "Automatización" },
  { value: "capacity", label: "Capacidad" },
  { value: "storage", label: "Almacenamiento" },
  { value: "users", label: "Usuarios" },
];

export default function AddonStorePage() {
  const navigate = useNavigate();
  const { addons, orgPlan, activeAddons, isLoading, error } = useAddonStore();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAddon, setSelectedAddon] = useState<BillingAddon | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredAddons =
    activeTab === "all"
      ? addons
      : addons.filter((a) => a.category === activeTab);

  const planCode = orgPlan?.plan_code ?? "free";
  const badgeClass = PLAN_BADGE[planCode] ?? PLAN_BADGE.free;

  // ── Loading ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Skeleton className="h-24 rounded-[14px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[14px]" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="bg-red-50 border border-red-200 rounded-[14px] p-6 text-center text-sm text-red-700">
          Error cargando el catálogo. Por favor recarga la página.
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 min-h-full"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#EEF2F7",
      }}
    >
      {/* ── HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">IP-NEXUS Store</h1>
          <p className="text-sm text-slate-500 mt-1">
            Expande las capacidades de tu despacho
          </p>
        </div>
        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full uppercase", badgeClass)}>
          {orgPlan?.plan_name ?? "Free"}
        </span>
      </div>

      {/* ── CARD PLAN ACTUAL ────────────────────────── */}
      <div
        className="bg-white rounded-[14px] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          boxShadow: "4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff",
        }}
      >
        <div>
          <p className="text-slate-500 text-sm">Plan actual</p>
          <p className="text-xl font-bold text-slate-800">
            {orgPlan?.plan_name ?? "Free"}
          </p>
          {orgPlan?.is_in_trial && (
            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Período de prueba
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="h-4 w-4" />
          <span>{activeAddons.length} add-ons activos</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/app/settings/billing")}
        >
          Cambiar plan
        </Button>
      </div>

      {/* ── ADD-ONS ACTIVOS ─────────────────────────── */}
      {activeAddons.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-600 mb-3">
            Actualmente contratado
          </p>
          <div className="flex flex-wrap gap-2">
            {activeAddons.map((addon) => (
              <button
                key={addon.code}
                onClick={() => {
                  setActiveTab("all");
                  setTimeout(() => {
                    document
                      .getElementById(addon.code)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200"
                style={{
                  backgroundColor: (addon.color_hex ?? "#64748B") + "26",
                  color: addon.color_hex ?? "#64748B",
                  border: `1px solid ${(addon.color_hex ?? "#64748B")}40`,
                }}
              >
                <LucideDynamicIcon
                  name={addon.icon_name}
                  fallback={<Package className="h-3 w-3" />}
                  size={12}
                />
                {addon.name_es} · ✓
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── GRID ────────────────────────────────────── */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filteredAddons.map((addon) => {
          const isActive = addon.is_contracted;
          const isCompatible =
            !isActive &&
            addon.compatible_plan_codes.includes(planCode);
          const isIncompatible = !isActive && !isCompatible;

          if (isActive) {
            return (
              <ActiveCard
                key={addon.code}
                addon={addon}
                onManage={() => navigate("/app/settings/billing")}
              />
            );
          }
          if (isCompatible) {
            return (
              <AvailableCard
                key={addon.code}
                addon={addon}
                onContract={() => setSelectedAddon(addon)}
              />
            );
          }
          return (
            <IncompatibleCard
              key={addon.code}
              addon={addon}
              onUpgrade={() => navigate("/app/settings/billing")}
            />
          );
        })}
      </div>

      {filteredAddons.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No hay add-ons disponibles en esta categoría.
        </div>
      )}

      {/* ── CONTACT MODAL ───────────────────────────── */}
      <Dialog
        open={selectedAddon !== null}
        onOpenChange={(open) => !open && setSelectedAddon(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contratar {selectedAddon?.name_es}</DialogTitle>
            <DialogDescription>
              €{selectedAddon?.price_monthly_eur}/mes · €
              {selectedAddon?.price_annual_eur}/mes anual
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {selectedAddon?.description_es}
          </p>
          <Separator />
          <p className="text-sm text-slate-500">
            Para activar este add-on contacta con nuestro equipo. Incluiremos tu
            plan actual en la solicitud.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              window.open(
                "mailto:" +
                  "ventas" +
                  "@" +
                  "ip-nexus.com" +
                  "?subject=Solicitud Add-on: " +
                  selectedAddon?.name_es +
                  "&body=Plan actual: " +
                  (orgPlan?.plan_code ?? "free") +
                  " | Add-on: " +
                  selectedAddon?.name_es,
                "_blank"
              );
            }}
          >
            Contactar equipo de ventas
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedAddon(null)}
          >
            Cerrar
          </Button>
          <p className="text-[11px] text-center text-slate-400 mt-1">
            La activación automática estará disponible próximamente.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Card Components ────────────────────────────────────

function ActiveCard({
  addon,
  onManage,
}: {
  addon: BillingAddon;
  onManage: () => void;
}) {
  return (
    <div
      id={addon.code}
      className="bg-white rounded-[14px] p-5 relative border-l-4 overflow-hidden duration-200"
      style={{
        borderLeftColor: addon.color_hex ?? "#64748B",
        backgroundColor: (addon.color_hex ?? "#64748B") + "0D",
      }}
    >
      <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
        ✓ Activo
      </span>
      <LucideDynamicIcon
        name={addon.icon_name}
        fallback={<Package className="h-5 w-5" />}
        size={20}
        color={addon.color_hex ?? "#64748B"}
        className="mb-3"
      />
      <p className="font-semibold text-slate-800 mb-1">{addon.name_es}</p>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {addon.description_es}
      </p>
      <p className="text-xs text-slate-400">
        €{addon.price_monthly_eur}/mes · Incluido
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        onClick={onManage}
      >
        Gestionar
      </Button>
    </div>
  );
}

function AvailableCard({
  addon,
  onContract,
}: {
  addon: BillingAddon;
  onContract: () => void;
}) {
  return (
    <div
      id={addon.code}
      className="bg-white rounded-[14px] p-5 relative duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
      style={{
        boxShadow: "4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff",
      }}
    >
      <LucideDynamicIcon
        name={addon.icon_name}
        fallback={<Package className="h-5 w-5" />}
        size={20}
        color={addon.color_hex ?? "#64748B"}
        className="mb-3"
      />
      <p className="font-semibold text-slate-800 mb-1">{addon.name_es}</p>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {addon.description_es}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700">
          €{addon.price_monthly_eur}/mes
        </p>
        {addon.annual_saving_eur > 0 && (
          <p className="text-xs text-slate-400">
            €{addon.price_annual_eur}/mes anual ·{" "}
            <span className="text-emerald-600 font-medium">
              Ahorra €{addon.annual_saving_eur}/año
            </span>
          </p>
        )}
      </div>
      <Button
        size="sm"
        className="mt-4 w-full text-white"
        style={{ backgroundColor: addon.color_hex ?? "#64748B" }}
        onClick={onContract}
      >
        Contratar
      </Button>
    </div>
  );
}

function IncompatibleCard({
  addon,
  onUpgrade,
}: {
  addon: BillingAddon;
  onUpgrade: () => void;
}) {
  return (
    <div
      id={addon.code}
      className="bg-white rounded-[14px] p-5 relative opacity-60"
      style={{
        boxShadow: "4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff",
      }}
    >
      <span className="inline-block text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium mb-3">
        Requiere plan superior
      </span>
      <LucideDynamicIcon
        name={addon.icon_name}
        fallback={<Package className="h-5 w-5" />}
        size={20}
        color="#94A3B8"
        className="mb-3"
      />
      <p className="font-semibold text-slate-400 mb-1">{addon.name_es}</p>
      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
        {addon.description_es}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        onClick={onUpgrade}
      >
        Actualizar plan
      </Button>
    </div>
  );
}
