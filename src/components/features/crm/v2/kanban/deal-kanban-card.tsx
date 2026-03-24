/**
 * DealKanbanCard — Pipedrive/HubSpot-style deal card
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Phone, Mail, FileText, Eye, MoreHorizontal, Calendar, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CRMDeal } from "@/hooks/crm/v2/types";

type Props = {
  deal: CRMDeal;
  stageColor?: string;
  isDragging?: boolean;
  onClick?: () => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function formatEUR(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function formatRelativeDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

function probColor(pct: number) {
  if (pct < 30) return "bg-red-500";
  if (pct < 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function probTrackColor(pct: number) {
  if (pct < 30) return "bg-red-100 dark:bg-red-950";
  if (pct < 70) return "bg-amber-100 dark:bg-amber-950";
  return "bg-emerald-100 dark:bg-emerald-950";
}

const TYPE_LABELS: Record<string, string> = {
  trademark: "⚖️ Trademark",
  patent: "🔬 Patent",
  design: "🎨 Design",
};

export function DealKanbanCard({ deal, stageColor, isDragging, onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  const accountName = deal.account?.name ?? deal.account_name_cache ?? "—";
  const probability = deal.probability_pct ?? deal.pipeline_stage?.probability ?? 0;
  const dealType = deal.deal_type ?? deal.opportunity_type;
  const jurisdiction = deal.jurisdiction_code;
  const closeDate = formatRelativeDate(deal.expected_close_date);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={cn(
        "relative bg-white rounded-xl border cursor-pointer transition-all duration-200 group",
        "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
        isDragging && "opacity-60 shadow-xl rotate-1 scale-105"
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: stageColor ?? "hsl(var(--border))" }}
    >
      {/* Top section */}
      <div className="p-3 pb-2">
        {/* Row 1: Avatar + company name + menu */}
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0",
              hashColor(accountName)
            )}
          >
            {initials(accountName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {accountName}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {deal.name}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1 rounded-md transition-opacity",
                  hovered ? "opacity-100 hover:bg-muted" : "opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={onClick}>Ver detalle</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-3" />

      {/* Middle section: amount + close date + jurisdiction + type */}
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            💶 {formatEUR(deal.amount_eur ?? deal.amount)}
          </span>
          {closeDate && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {closeDate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {jurisdiction && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {jurisdiction.toUpperCase()}
            </span>
          )}
          {dealType && (
            <span>{TYPE_LABELS[dealType] ?? dealType}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-3" />

      {/* Probability bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", probTrackColor(probability))}>
            <div
              className={cn("h-full rounded-full transition-all", probColor(probability))}
              style={{ width: `${probability}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground w-8 text-right">
            {probability}%
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-3" />

      {/* Bottom: actions (on hover) + activity indicator */}
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Quick actions — visible on hover */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            hovered ? "opacity-100" : "opacity-0"
          )}
        >
          {[
            { icon: Phone, label: "Llamar" },
            { icon: Mail, label: "Email" },
            { icon: FileText, label: "Nota" },
            { icon: Eye, label: "Ver" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (label === "Ver") onClick?.();
              }}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Days in stage */}
        {deal.stage_entered_at && (
          <span className={cn(
            "text-[11px] flex items-center gap-1",
            (() => {
              const days = Math.floor((Date.now() - new Date(deal.stage_entered_at).getTime()) / 86400000);
              if (days > 14) return "text-red-500";
              if (days > 7) return "text-amber-500";
              return "text-muted-foreground";
            })()
          )}>
            🟢 {Math.floor((Date.now() - new Date(deal.stage_entered_at).getTime()) / 86400000)}d
          </span>
        )}
      </div>
    </div>
  );
}
