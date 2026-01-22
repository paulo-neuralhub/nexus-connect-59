import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Building2, MessageSquareText } from "lucide-react";
import { useCRMContact } from "@/hooks/crm/v2/contacts";
import { useCRMDeals } from "@/hooks/crm/v2/deals";
import { useCRMInteractions } from "@/hooks/crm/v2/interactions";
import { useOrganization } from "@/contexts/organization-context";
import { CommunicationHistory, ContactActionButtons } from "@/components/features/crm/v2";

type Contact = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  account_id?: string | null;
  account?: { id: string; name?: string | null } | null;
  is_lead?: boolean | null;
  lead_status?: string | null;
  lead_score?: number | null;
};

type DealRow = { id: string; name?: string | null; stage?: string | null; amount?: number | null };
type InteractionRow = { id: string; created_at?: string | null; subject?: string | null; channel?: string | null };

export default function CRMV2ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  const { data: contactData, isLoading: loadingContact } = useCRMContact(id);
  const contact = useMemo(() => (contactData as Contact | null) ?? null, [contactData]);

  const { data: dealsData, isLoading: loadingDeals } = useCRMDeals(
    contact?.account_id ? { account_id: contact.account_id } : undefined
  );
  const { data: interactionsData, isLoading: loadingInteractions } = useCRMInteractions(
    contact?.account_id ? { account_id: contact.account_id } : undefined
  );

  const deals = useMemo(() => ((dealsData ?? []) as DealRow[]).slice(0, 5), [dealsData]);
  const interactions = useMemo(() => ((interactionsData ?? []) as InteractionRow[]).slice(0, 5), [interactionsData]);

  usePageTitle(contact?.full_name || "Contacto");

  if (loadingContact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-7 w-60" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">Contacto no encontrado</p>
        <Button variant="link" onClick={() => navigate("/app/crm/contacts")}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/crm/contacts")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{contact.full_name || contact.id}</h1>
            <p className="text-muted-foreground text-sm">
              {contact.account?.name ? `Cuenta: ${contact.account.name}` : "Sin cuenta"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{contact.account?.name ?? "—"}</span>
              </div>
              {contact.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a className="text-sm hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              ) : null}
              {contact.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lead</span>
                <span className="font-medium">{contact.is_lead ? (contact.lead_status ?? "lead") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lead score</span>
                <span className="font-medium">{contact.lead_score ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimos deals</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDeals ? (
                <Skeleton className="h-24 w-full" />
              ) : deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals.</p>
              ) : (
                <div className="space-y-2">
                  {deals.map((d) => (
                    <div key={d.id} className="rounded-lg border p-3">
                      <p className="font-medium">{d.name || d.id}</p>
                      <p className="text-xs text-muted-foreground">{d.stage ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimas interacciones</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInteractions ? (
                <Skeleton className="h-24 w-full" />
              ) : interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin interacciones.</p>
              ) : (
                <div className="space-y-2">
                  {interactions.map((i) => (
                    <div key={i.id} className="rounded-lg border p-3">
                      <p className="font-medium">{i.subject || i.channel || "Interacción"}</p>
                      <p className="text-xs text-muted-foreground">{i.created_at ? new Date(i.created_at).toLocaleString("es-ES") : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" />
                Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ContactActionButtons
                contact={{
                  id: contact.id,
                  full_name: contact.full_name || contact.id,
                  email: contact.email,
                  phone: contact.phone,
                }}
              />

              {contact.account_id ? (
                <Button className="w-full" variant="outline" onClick={() => navigate(`/app/crm/accounts/${contact.account_id}`)}>
                  Ver cuenta
                </Button>
              ) : null}
              {contact.account_id ? (
                <Button className="w-full" variant="outline" onClick={() => navigate(`/app/crm/interactions?account=${contact.account_id}`)}>
                  Ver timeline
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {currentOrganization?.id ? (
            <CommunicationHistory contactId={contact.id} organizationId={currentOrganization.id} maxHeight="520px" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
