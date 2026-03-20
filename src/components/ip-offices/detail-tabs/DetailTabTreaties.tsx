/**
 * Detail Tab: International Treaties
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  office: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  member: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Miembro" },
  active: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Miembro" },
  signatory: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20", label: "Signatario" },
  not_member: { icon: XCircle, color: "text-muted-foreground/40", bg: "bg-muted/30", label: "No miembro" },
  withdrawn: { icon: MinusCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", label: "Retirado" },
};

export function DetailTabTreaties({ office }: Props) {
  const { data: treaties, isLoading } = useQuery({
    queryKey: ["ipo-treaty-status", office.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ipo_treaty_status")
        .select("*")
        .eq("office_id", office.id as string)
        .order("treaty_name", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!office.id,
  });

  // Fallback: show basic treaty info from ipo_offices fields
  const madridMember = office.member_madrid_protocol as boolean | null;
  const parisMember = office.paris_convention_member as boolean | null;

  const treatyList = treaties || [];
  const activeCount = treatyList.filter((t: any) =>
    t.status === "member" || t.status === "active" || t.status === "signatory"
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando tratados...
        </CardContent>
      </Card>
    );
  }

  // If no treaty_status records, show fallback from ipo_offices columns
  if (treatyList.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📜 Tratados Internacionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TreatyRow name="Protocolo de Madrid" isMember={madridMember} />
            <TreatyRow name="Convenio de París" isMember={parisMember} />
            <p className="text-xs text-muted-foreground pt-2">
              Datos básicos. No hay registros detallados de tratados para esta oficina.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📜 Tratados Internacionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {treatyList.map((treaty: any, i: number) => {
            const config = STATUS_CONFIG[treaty.status] || STATUS_CONFIG.not_member;
            const Icon = config.icon;
            return (
              <div key={treaty.id || i}
                className={cn("flex items-center justify-between p-2 rounded text-sm", config.bg)}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                  <span className={treaty.status === "not_member" ? "text-muted-foreground" : "text-foreground"}>
                    {treaty.treaty_name}
                  </span>
                  {treaty.has_reservations && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 ml-1">
                      Con reservas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {treaty.ratification_date && (
                    <span className="text-xs text-muted-foreground">
                      Ratificación: {new Date(treaty.ratification_date).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="pt-2 text-xs text-muted-foreground">
            Miembro de {activeCount}/{treatyList.length} tratados
          </div>
        </CardContent>
      </Card>

      {/* Reservations */}
      {treatyList.some((t: any) => t.has_reservations && t.reservations_text) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">⚠️ Reservas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {treatyList.filter((t: any) => t.has_reservations && t.reservations_text)
              .map((t: any, i: number) => (
                <div key={i} className="p-2 rounded bg-yellow-50 dark:bg-yellow-950/20 text-sm">
                  <span className="font-medium">{t.treaty_name}:</span>{" "}
                  <span className="text-muted-foreground">{t.reservations_text}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TreatyRow({ name, isMember }: { name: string; isMember: boolean | null }) {
  const yes = isMember === true;
  return (
    <div className={cn("flex items-center justify-between p-2 rounded text-sm",
      yes ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30")}>
      <div className="flex items-center gap-2">
        {yes ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
        <span className={yes ? "text-foreground" : "text-muted-foreground"}>{name}</span>
      </div>
      <Badge variant="outline" className={cn("text-xs",
        yes ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "")}>
        {isMember === null ? "Sin datos" : yes ? "Miembro" : "No miembro"}
      </Badge>
    </div>
  );
}
