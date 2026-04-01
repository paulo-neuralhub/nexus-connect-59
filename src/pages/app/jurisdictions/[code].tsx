/**
 * Tenant Jurisdiction Detail — /app/jurisdictions/:code
 * Reuses backoffice detail tab components, read-only, no Commercial tab
 */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Lock } from "lucide-react";
import { DetailTabGeneral } from "@/components/ip-offices/detail-tabs/DetailTabGeneral";
import { DetailTabFees } from "@/components/ip-offices/detail-tabs/DetailTabFees";
import { DetailTabTreaties } from "@/components/ip-offices/detail-tabs/DetailTabTreaties";
import { DetailTabDigital } from "@/components/ip-offices/detail-tabs/DetailTabDigital";
import { DetailTabProcess } from "@/components/ip-offices/detail-tabs/DetailTabProcess";
import { DetailTabRequirements } from "@/components/ip-offices/detail-tabs/DetailTabRequirements";
import { OfficeIntelligencePanel } from "@/components/ip-offices/OfficeIntelligencePanel";

function useOfficeByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["ipo-office-tenant", code],
    enabled: !!code,
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from("ipo_offices")
        .select("*")
        .eq("country_code", code)
        .maybeSingle();
      // Fallback: try by `code` column
      if (!data && !error) {
        const { data: d2, error: e2 } = await supabase
          .from("ipo_offices")
          .select("*")
          .eq("code", code)
          .maybeSingle();
        if (e2) throw e2;
        return d2 as Record<string, unknown> | null;
      }
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
  });
}

function useIsSubscribed(code: string | undefined) {
  return useQuery({
    queryKey: ["jurisdiction-subscribed", code],
    enabled: !!code,
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_jurisdictions")
        .select("id")
        .eq("jurisdiction_code", code!)
        .eq("is_active", true)
        .maybeSingle();
      return !!data;
    },
  });
}

export default function JurisdictionDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: office, isLoading } = useOfficeByCode(code);
  const { data: isSubscribed, isLoading: loadingSub } = useIsSubscribed(code);

  if (isLoading || loadingSub) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Jurisdicción no encontrada</h1>
        <p className="text-muted-foreground">No se encontró una oficina con código "{code}"</p>
        <Button onClick={() => navigate("/app/jurisdictions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ver mis jurisdicciones
        </Button>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/jurisdictions")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Mis Jurisdicciones
        </Button>
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Jurisdicción no disponible</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Esta jurisdicción no está incluida en tu suscripción.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/app/jurisdictions")}>
              Ver mis jurisdicciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb / back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/jurisdictions")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Jurisdicciones
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <span className="text-5xl">{String(office.flag_emoji || office.country_flag || "🏛️")}</span>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {String(office.office_acronym || office.code || "")} — {String(office.name_official || office.name || office.country_name || "")}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {office.office_type === "international" ? "🌐 Internacional" :
               office.office_type === "regional" ? "🌍 Regional" : "🏛️ Nacional"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs — no Commercial tab */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="general" className="text-sm">📋 General</TabsTrigger>
          <TabsTrigger value="process" className="text-sm">⚙️ PI y Proceso</TabsTrigger>
          <TabsTrigger value="fees" className="text-sm">💰 Tasas</TabsTrigger>
          <TabsTrigger value="treaties" className="text-sm">📜 Tratados</TabsTrigger>
          <TabsTrigger value="digital" className="text-sm">🤖 Digital</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-sm">💡 Inteligencia</TabsTrigger>
          <TabsTrigger value="requirements" className="text-sm">📋 Requisitos</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><DetailTabGeneral office={office} /></TabsContent>
        <TabsContent value="process"><DetailTabProcess office={office} /></TabsContent>
        <TabsContent value="fees"><DetailTabFees office={office} /></TabsContent>
        <TabsContent value="treaties"><DetailTabTreaties office={office} /></TabsContent>
        <TabsContent value="digital"><DetailTabDigital office={office} /></TabsContent>
        <TabsContent value="intelligence">
          <OfficeIntelligencePanel office={office as any} showInternalScores={false} />
        </TabsContent>
        <TabsContent value="requirements"><DetailTabRequirements office={office} /></TabsContent>
      </Tabs>
    </div>
  );
}
