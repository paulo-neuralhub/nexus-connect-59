/**
 * CRM V2 Account Detail — 6 IP-specialized tabs
 * Uses crm_* hooks directly for full schema alignment
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useCRMAccountDetail } from "@/hooks/crm/v2/accounts";
import { useCRMDeals } from "@/hooks/crm/v2/deals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Edit, Star, MoreHorizontal, Mail, Phone,
  Archive, Trash2, Building2, Users, Briefcase, TrendingUp,
  Clock, FileText, AlertTriangle, Globe, ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// Tab components
import { AccountOverviewTab } from "./tabs/AccountOverviewTab";
import { AccountContactsTab } from "./tabs/AccountContactsTab";
import { AccountPortfolioTab } from "./tabs/AccountPortfolioTab";
import { AccountDealsTab } from "./tabs/AccountDealsTab";
import { AccountActivitiesTab } from "./tabs/AccountActivitiesTab";
import { AccountDocumentsTab } from "./tabs/AccountDocumentsTab";
import { AccountAgentTab } from "./tabs/AccountAgentTab";
import { AccountPortalTab } from "./tabs/AccountPortalTab";
import { AccountInstructionsTab } from "./tabs/AccountInstructionsTab";
import { InteractionFormModal } from "@/components/features/crm/v2/InteractionFormModal";
import { IPCoPilotPanel } from "@/components/features/crm/v2/IPCoPilotPanel";
import { openSoftphone } from "@/components/telephony/IPSoftphone";
export default function CRMV2AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showActivityModal, setShowActivityModal] = useState(false);

  const { data, isLoading, error } = useCRMAccountDetail(id);
  const { data: deals = [] } = useCRMDeals(id ? { account_id: id } : undefined);

  if (!id) {
    return <div className="p-6 text-center text-muted-foreground">ID de cliente no proporcionado</div>;
  }

  if (isLoading) return <DetailSkeleton />;

  if (error || !data?.account) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Cuenta no encontrada</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la información.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { account, contacts, activities, mattersCount } = data;
  const rating = account.rating_stars ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver
              </Button>

              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                  {account.name?.substring(0, 2).toUpperCase() ?? "CL"}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{account.name}</h1>
                  {account.status && (
                    <Badge variant={account.status === "active" ? "default" : "secondary"}>
                      {account.status === "active" ? "Activo" : account.status}
                    </Badge>
                  )}
                  {account.tier && <Badge variant="outline">{account.tier}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {account.tax_id && (
                    <span className="font-mono bg-muted px-2 py-0.5 rounded">{account.tax_id}</span>
                  )}
                  {account.assigned_user && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {[account.assigned_user.first_name, account.assigned_user.last_name].filter(Boolean).join(" ")}
                    </span>
                  )}
                  {account.created_at && (
                    <span>Desde {format(new Date(account.created_at), "MMMM yyyy", { locale: es })}</span>
                  )}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("w-3 h-3", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const phoneNumber = account.phone || contacts[0]?.phone || "";
                  if (phoneNumber) {
                    openSoftphone(phoneNumber, {
                      accountId: id,
                      accountName: account.name,
                      contactName: contacts[0]?.first_name
                        ? `${contacts[0].first_name} ${contacts[0].last_name || ""}`
                        : undefined,
                      contactId: contacts[0]?.id,
                    });
                  } else {
                    openSoftphone("", { accountId: id, accountName: account.name });
                  }
                }}
              >
                <Phone className="w-4 h-4 mr-1" /> Llamar
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-1" /> Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Mail className="w-4 h-4 mr-2" /> Email</DropdownMenuItem>
                  <DropdownMenuItem><Phone className="w-4 h-4 mr-2" /> Llamar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Archive className="w-4 h-4 mr-2" /> Archivar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* TABS + COPILOT */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full justify-start bg-muted/50 h-auto flex-wrap p-1">
                  <TabsTrigger value="overview" className="gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Resumen
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Contactos
                    {contacts.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{contacts.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Portfolio PI
                    {mattersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{mattersCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="deals" className="gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Deals
                    {deals.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{deals.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Actividades
                    {activities.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activities.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Documentos
                  </TabsTrigger>
                  {(account as any).is_agent && (
                    <TabsTrigger value="agent" className="gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Agente
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="instructions" className="gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Instrucciones
                  </TabsTrigger>
                  <TabsTrigger value="portal" className="gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Portal
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <AccountOverviewTab
                    account={account}
                    contactsCount={contacts.length}
                    dealsCount={deals.length}
                    mattersCount={mattersCount}
                    activitiesCount={activities.length}
                  />
                </TabsContent>

                <TabsContent value="contacts">
                  <AccountContactsTab contacts={contacts} />
                </TabsContent>

                <TabsContent value="portfolio">
                  <AccountPortfolioTab accountId={id} />
                </TabsContent>

                <TabsContent value="deals">
                  <AccountDealsTab deals={deals as any} />
                </TabsContent>

                <TabsContent value="activities">
                  <AccountActivitiesTab
                    accountId={id}
                    onAddActivity={() => setShowActivityModal(true)}
                  />
                </TabsContent>

                <TabsContent value="documents">
                  <AccountDocumentsTab accountId={id} />
                </TabsContent>

                {(account as any).is_agent && (
                  <TabsContent value="agent">
                    <AccountAgentTab
                      accountId={id}
                      accountName={account.name}
                      isAgent={true}
                      isLicensedAgent={(account as any).is_licensed_agent}
                      agentLicenseType={(account as any).agent_license_type}
                      billingType={(account as any).billing_type}
                      discountPct={(account as any).discount_pct}
                      portalType={(account as any).portal_type}
                    />
                  </TabsContent>
                )}

                <TabsContent value="instructions">
                  <AccountInstructionsTab accountId={id} accountName={account.name} />
                </TabsContent>

                <TabsContent value="portal">
                  <AccountPortalTab accountId={id} accountName={account.name} />
                </TabsContent>
              </Tabs>
            </div>

            {/* CoPilot sidebar */}
            <div className="w-[320px] shrink-0 hidden xl:block">
              <div className="sticky top-4">
                <IPCoPilotPanel accountId={id} accountName={account.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <InteractionFormModal
        open={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        defaultAccountId={id}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
