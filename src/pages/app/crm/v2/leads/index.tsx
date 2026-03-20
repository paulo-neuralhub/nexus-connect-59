import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMLeads, useConvertLead } from "@/hooks/crm/v2/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, TrendingUp, Clock, Phone, Mail, MessageCircle, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadFormModal } from "@/components/features/crm/v2/LeadFormModal";
import type { CRMLead } from "@/hooks/crm/v2/types";

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Cualificado",
  nurturing: "Nurturing",
  converted: "Convertido",
  lost: "Perdido",
};

function LeadStatusBadge({ status }: { status?: string | null }) {
  const label = status ? (STATUS_LABELS[status] ?? status) : "—";
  const variant = status === "qualified" || status === "converted" ? "secondary" : status === "lost" ? "destructive" : "outline";
  return <Badge variant={variant as any}>{label}</Badge>;
}

function LeadScoreBar({ score }: { score?: number | null }) {
  const s = Math.max(0, Math.min(100, Number(score ?? 0)));
  const color = s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-muted-foreground/30";

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${s}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{s}</span>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function CRMLeadsPage() {
  usePageTitle("Leads");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Conversion state
  const [convertingLead, setConvertingLead] = useState<CRMLead | null>(null);
  const [accountName, setAccountName] = useState("");
  const convertMutation = useConvertLead();

  const { data, isLoading } = useCRMLeads({ search: search || undefined, status });

  const leads = useMemo(() => data ?? [], [data]);
  const total = leads.length;
  const hot = leads.filter((l) => (l.lead_score ?? 0) >= 80).length;
  const news = leads.filter((l) => (l.lead_status ?? "") === "new").length;
  const qualified = leads.filter((l) => (l.lead_status ?? "") === "qualified").length;

  function openConvert(lead: CRMLead) {
    setConvertingLead(lead);
    setAccountName(lead.company_name || lead.full_name);
  }

  async function handleConvert() {
    if (!convertingLead) return;
    const result = await convertMutation.mutateAsync({
      leadId: convertingLead.id,
      accountName,
    });
    setConvertingLead(null);
    setAccountName("");
    navigate(`/app/crm/clients/${result.accountId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Gestiona prospectos y conviértelos en clientes</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <UserPlus className="w-4 h-4" />
          Nuevo Lead
        </Button>
      </div>

      {/* SILK NeoBadge KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, accent: false },
          { label: "Calientes (≥80)", value: hot, accent: hot > 0 },
          { label: "Nuevos", value: news, accent: false },
          { label: "Cualificados", value: qualified, accent: qualified > 0 },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4"
            style={{
              background: "hsl(var(--muted))",
              border: kpi.accent ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
            }}
          >
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar leads…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["new", "contacted", "qualified", "nurturing"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              onClick={() => setStatus(status === s ? null : s)}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Lead List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8" />}
          title="Sin leads"
          description={search ? "No hay leads que coincidan con tu búsqueda." : "Crea tu primer lead para empezar el funnel de ventas."}
          actionLabel="Crear lead"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 transition-colors hover:bg-muted/40"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                {lead.full_name?.charAt(0)?.toUpperCase() ?? "L"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">{lead.full_name}</p>
                  <LeadStatusBadge status={lead.lead_status} />
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {lead.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </span>
                  )}
                  {lead.company_name && <span>🏢 {lead.company_name}</span>}
                  {lead.source && <span>📌 {lead.source}</span>}
                </div>
              </div>

              {/* Score */}
              <LeadScoreBar score={lead.lead_score} />

              {/* Time */}
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {timeAgo(lead.created_at)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" disabled={!lead.phone} aria-label="Llamar" className="h-8 w-8">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={!lead.email} aria-label="Email" className="h-8 w-8">
                  <Mail className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={!lead.whatsapp_phone} aria-label="WhatsApp" className="h-8 w-8">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                {lead.lead_status === "qualified" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs ml-1"
                    onClick={() => openConvert(lead)}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Convertir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadFormModal open={showForm} onClose={() => setShowForm(false)} />

      {/* Conversion Dialog */}
      <Dialog open={!!convertingLead} onOpenChange={(open) => !open && setConvertingLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convertir Lead a Cliente</DialogTitle>
            <DialogDescription>
              Se creará una cuenta y un contacto a partir de <strong>{convertingLead?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="account_name">Nombre de la cuenta</Label>
              <Input
                id="account_name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nombre de empresa o persona"
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground space-y-1">
              <p>📧 {convertingLead?.email || "Sin email"}</p>
              <p>📞 {convertingLead?.phone || "Sin teléfono"}</p>
              {convertingLead?.company_name && <p>🏢 {convertingLead.company_name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConvertingLead(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConvert} disabled={convertMutation.isPending || !accountName.trim()}>
              {convertMutation.isPending ? "Convirtiendo..." : "Convertir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
