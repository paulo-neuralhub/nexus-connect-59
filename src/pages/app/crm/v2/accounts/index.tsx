/**
 * CRM Clients List - Grid de tarjetas profesionales estilo Odoo/Bitrix
 * Estadísticas mini-cards, badges tipo, rating, clasificación pago
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
  Briefcase,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountRow = {
  id: string;
  name?: string | null;
  legal_name?: string | null;
  status?: string | null;
  tier?: string | null;
  health_score?: number | null;
  rating_stars?: number | null;
  tags?: string[] | null;
  last_interaction_at?: string | null;
  client_type?: { id: string; name?: string | null; color?: string | null } | null;
  payment_classification?: { 
    id: string; 
    name?: string | null; 
    color?: string | null; 
    alert_level?: string | null;
  } | null;
};

// Colores para clasificación de pago
const PAYMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  excelente: { bg: "bg-green-100 dark:bg-green-950/50", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  bueno: { bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  regular: { bg: "bg-yellow-100 dark:bg-yellow-950/50", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  malo: { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  moroso: { bg: "bg-red-100 dark:bg-red-950/50", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  litigio: { bg: "bg-red-200 dark:bg-red-950", text: "text-red-800 dark:text-red-300", dot: "bg-red-600" },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ClientCard({ account, onClick }: { account: AccountRow; onClick: () => void }) {
  const clientTypeName = account.client_type?.name?.toLowerCase() ?? "directo";
  const clientTypeColor = account.client_type?.color || "#3B82F6";
  const paymentName = account.payment_classification?.name?.toLowerCase() ?? "regular";
  const paymentStyle = PAYMENT_COLORS[paymentName] || PAYMENT_COLORS.regular;
  const rating = account.rating_stars ?? 0;

  // Mock stats - TODO: connect to real data via RPC
  const stats = {
    contacts: Math.floor(Math.random() * 5) + 1,
    matters: Math.floor(Math.random() * 8) + 1,
    deals: Math.floor(Math.random() * 3),
    invoiced: Math.floor(Math.random() * 100000),
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.01]"
      )}
    >
      <div className="p-5">
        {/* Header: Type Badge + Rating */}
        <div className="flex items-start justify-between mb-4">
          <Badge 
            className="text-xs font-bold px-2.5 py-1"
            style={{ 
              backgroundColor: `${clientTypeColor}20`, 
              color: clientTypeColor,
              borderColor: clientTypeColor 
            }}
          >
            {account.client_type?.name?.toUpperCase() || "CLIENTE"}
          </Badge>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("w-4 h-4", i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
              />
            ))}
          </div>
        </div>

        {/* Company Name + Avatar */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: clientTypeColor }}
          >
            {getInitials(account.name || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate text-lg">
              {account.name || account.legal_name || "Sin nombre"}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {account.legal_name || "Sin razón social"}
            </p>
          </div>
        </div>

        {/* Payment Classification */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mb-4",
          paymentStyle.bg, 
          paymentStyle.text
        )}>
          <span className={cn("w-2.5 h-2.5 rounded-full", paymentStyle.dot)} />
          {account.payment_classification?.name || "Sin clasificar"}
        </div>

        {/* Tags */}
        {account.tags && account.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {account.tags.slice(0, 4).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {account.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{account.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-border mb-4" />

        {/* Stats Mini-Cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">{stats.contacts}</span>
            <p className="text-[10px] text-muted-foreground">Contactos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">{stats.matters}</span>
            <p className="text-[10px] text-muted-foreground">Expedientes</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">{stats.deals}</span>
            <p className="text-[10px] text-muted-foreground">Negociaciones</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-bold text-green-600">€{Math.round(stats.invoiced / 1000)}K</span>
            <p className="text-[10px] text-muted-foreground">Facturado</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border mb-4" />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
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
                    className="h-9 w-9 rounded-lg bg-muted text-muted-foreground hover:bg-green-500 hover:text-white"
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
                    className="h-9 w-9 rounded-lg bg-muted text-muted-foreground hover:bg-purple-500 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Email</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <Button variant="default" size="sm" className="gap-1.5">
            Ver ficha
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
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
      filtered = filtered.filter(a => 
        a.client_type?.name?.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    if (paymentFilter !== "all") {
      filtered = filtered.filter(a => 
        a.payment_classification?.name?.toLowerCase() === paymentFilter.toLowerCase()
      );
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
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Clasificación pago" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 px-6 text-center border rounded-xl bg-muted/30">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">Sin clientes</p>
          <p className="text-sm text-muted-foreground mb-4">No se encontraron clientes con estos filtros.</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear primer cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
