/**
 * CRM Clients List - Grid de tarjetas profesionales
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMAccounts } from "@/hooks/crm/v2/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  User,
  FileText,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountRow = {
  id: string;
  name?: string | null;
  legal_name?: string | null;
  tax_id?: string | null;
  city?: string | null;
  country?: string | null;
  status?: string | null;
  tier?: string | null;
  health_score?: number | null;
  client_type?: string | null;
  payment_classification?: string | null;
  rating?: number | null;
  total_invoiced?: number | null;
  contact_count?: number | null;
  matter_count?: number | null;
  primary_contact_name?: string | null;
  primary_contact_phone?: string | null;
  primary_contact_email?: string | null;
  tags?: string[] | null;
};

// Colores para tipos de cliente
const CLIENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  directo: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  agente: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  grupo: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  partner: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  prospecto: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
};

// Colores para clasificación de pago
const PAYMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  excelente: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  bueno: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  regular: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  malo: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  moroso: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  litigio: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function ClientCard({ account, onClick }: { account: AccountRow; onClick: () => void }) {
  const typeStyle = CLIENT_TYPE_COLORS[account.client_type?.toLowerCase() ?? ""] || CLIENT_TYPE_COLORS.directo;
  const paymentStyle = PAYMENT_COLORS[account.payment_classification?.toLowerCase() ?? ""] || PAYMENT_COLORS.regular;
  const rating = account.rating ?? 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01]"
      )}
    >
      {/* Header: Type + Rating */}
      <div className="flex items-start justify-between mb-3">
        <Badge className={cn("text-xs font-medium border", typeStyle.bg, typeStyle.text, typeStyle.border)}>
          {account.client_type?.toUpperCase() || "CLIENTE"}
        </Badge>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("w-3.5 h-3.5", i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
            />
          ))}
        </div>
      </div>

      {/* Company Name + Tax ID + City */}
      <div className="mb-3">
        <h3 className="font-semibold text-foreground truncate">{account.name || account.legal_name || "Sin nombre"}</h3>
        <p className="text-xs text-muted-foreground">
          {account.tax_id ? `${account.tax_id} • ` : ""}{account.city || account.country || "—"}
        </p>
      </div>

      {/* Payment Classification */}
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium mb-3", paymentStyle.bg, paymentStyle.text)}>
        <span className={cn("w-2 h-2 rounded-full", paymentStyle.dot)} />
        {account.payment_classification || "Sin clasificar"}
      </div>

      {/* Tags */}
      {account.tags && account.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {account.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {account.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{account.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3 mb-3">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          <span>{account.contact_count ?? 0} contactos</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          <span>{account.matter_count ?? 0} exp.</span>
        </div>
        <div className="flex items-center gap-1 text-green-600 font-medium">
          {formatCurrency(account.total_invoiced ?? 0)}
        </div>
      </div>

      {/* Primary Contact */}
      {account.primary_contact_name && (
        <div className="text-xs text-muted-foreground mb-3 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{account.primary_contact_name}</span>
            <span className="text-muted-foreground">(Principal)</span>
          </div>
          {account.primary_contact_phone && (
            <div className="flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{account.primary_contact_phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-primary hover:text-primary-foreground"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Llamar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-green-500 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>WhatsApp</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-purple-500 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Email</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          Ver <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function CRMV2AccountsList() {
  usePageTitle("Clientes");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const { data, isLoading } = useCRMAccounts({ search: search || undefined });

  const rows = useMemo(() => {
    let filtered = (data ?? []) as AccountRow[];
    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.client_type?.toLowerCase() === typeFilter.toLowerCase());
    }
    if (paymentFilter !== "all") {
      filtered = filtered.filter(a => a.payment_classification?.toLowerCase() === paymentFilter.toLowerCase());
    }
    return filtered;
  }, [data, typeFilter, paymentFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus clientes y empresas</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="directo">Directo</SelectItem>
            <SelectItem value="agente">Agente PI</SelectItem>
            <SelectItem value="grupo">Grupo</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="prospecto">Prospecto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Clasificación" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="excelente">Excelente</SelectItem>
            <SelectItem value="bueno">Bueno</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="malo">Malo</SelectItem>
            <SelectItem value="moroso">Moroso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-14 px-6 text-center border rounded-lg bg-muted/30">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-lg">Sin clientes</p>
          <p className="text-sm text-muted-foreground mb-4">No se encontraron clientes con estos filtros.</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear primer cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((account) => (
            <ClientCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/app/crm/clients/${account.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
