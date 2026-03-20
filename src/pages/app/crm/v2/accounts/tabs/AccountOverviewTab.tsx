/**
 * CRM Account Detail — Tab: Resumen (Overview)
 * Shows key account info, KPIs, and assigned user
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2, Globe, MapPin, Briefcase, TrendingUp, Star,
  Calendar, User, FileText, Receipt
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CRMAccount } from "@/hooks/crm/v2/types";

interface Props {
  account: CRMAccount;
  contactsCount: number;
  dealsCount: number;
  mattersCount: number;
  activitiesCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  prospect: "bg-primary/15 text-primary",
};

const TIER_STYLES: Record<string, string> = {
  bronze: "bg-amber-700/15 text-amber-800 dark:text-amber-400",
  silver: "bg-slate-400/15 text-slate-600 dark:text-slate-300",
  gold: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  platinum: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

function KpiCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountOverviewTab({ account, contactsCount, dealsCount, mattersCount, activitiesCount }: Props) {
  const rating = account.rating_stars ?? 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Briefcase} label="Expedientes" value={mattersCount} />
        <KpiCard icon={TrendingUp} label="Deals activos" value={dealsCount} />
        <KpiCard icon={User} label="Contactos" value={contactsCount} />
        <KpiCard icon={FileText} label="Actividades" value={activitiesCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Datos de empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nombre comercial" value={account.name} />
            <Row label="Razón social" value={account.legal_name} />
            <Row label="NIF/CIF" value={account.tax_id} mono />
            <Row label="Token cliente" value={account.client_token} mono />
            <Row label="Tipo de cuenta" value={account.account_type} />
            <Row label="Industria" value={account.industry} />
            {(account.city || account.country_code) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{[account.city, account.country_code].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Clasificación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge className={cn("font-medium", STATUS_STYLES[account.status ?? ""] ?? "bg-muted text-muted-foreground")}>
                {account.status ?? "—"}
              </Badge>
            </div>
            {account.tier && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nivel</span>
                <Badge className={cn("font-medium", TIER_STYLES[account.tier] ?? "bg-muted text-muted-foreground")}>
                  {account.tier}
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rating</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("w-4 h-4", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Etapa</span>
              <span className="font-medium">{account.lifecycle_stage ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Portfolio PI</span>
              <span className="font-mono font-semibold">{account.ip_portfolio_size ?? 0} registros</span>
            </div>
            {account.annual_ip_budget_eur != null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Presupuesto PI anual</span>
                <span className="font-mono font-semibold">€{account.annual_ip_budget_eur.toLocaleString()}</span>
              </div>
            )}
            {account.assigned_user && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Responsable</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {(account.assigned_user.first_name?.[0] ?? "") + (account.assigned_user.last_name?.[0] ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {[account.assigned_user.first_name, account.assigned_user.last_name].filter(Boolean).join(" ")}
                  </span>
                </div>
              </div>
            )}
            {account.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cliente desde</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(account.created_at), "MMMM yyyy", { locale: es })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {account.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{account.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {account.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {account.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
