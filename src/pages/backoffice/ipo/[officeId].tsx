/**
 * IP Office Detail Page — Full page with tabs
 * Route: /backoffice/ipo/:officeId (officeId is actually the code like "EM")
 */
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { useIpOfficeByCode } from "@/hooks/useIpOfficeDetail";
import { DetailTabGeneral } from "@/components/ip-offices/detail-tabs/DetailTabGeneral";
import { DetailTabCommercial } from "@/components/ip-offices/detail-tabs/DetailTabCommercial";
import { DetailTabFees } from "@/components/ip-offices/detail-tabs/DetailTabFees";
import { DetailTabTreaties } from "@/components/ip-offices/detail-tabs/DetailTabTreaties";
import { DetailTabDigital } from "@/components/ip-offices/detail-tabs/DetailTabDigital";
import { DetailTabProcess } from "@/components/ip-offices/detail-tabs/DetailTabProcess";
import { DetailTabRequirements } from "@/components/ip-offices/detail-tabs/DetailTabRequirements";
import { OfficeIntelligencePanel } from "@/components/ip-offices/OfficeIntelligencePanel";

export default function IpOfficeDetailPage() {
  const { officeId: code } = useParams<{ officeId: string }>();
  const navigate = useNavigate();
  const { data: office, isLoading } = useIpOfficeByCode(code);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Oficina no encontrada</h1>
        <p className="text-muted-foreground">No se encontró una oficina con código "{code}"</p>
        <Button onClick={() => navigate("/backoffice/ipo/directory")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al directorio
        </Button>
      </div>
    );
  }

  const dataConfidence = office.data_confidence as string | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/backoffice/ipo/directory")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al directorio
        </Button>

        <div className="flex items-start gap-4">
          <span className="text-5xl">{(office.flag_emoji as string) || (office.country_flag as string) || "🏛️"}</span>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {(office.office_acronym as string) || (office.code as string)} — {(office.name_official as string) || (office.name as string) || (office.country_name as string)}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {office.office_type === "international" ? "🌐 Internacional" :
                 office.office_type === "regional" ? "🌍 Regional" : "🏛️ Nacional"}
              </Badge>
            </div>
          </div>
        </div>

        {office.data_quality_flag === "red" && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">⚠️ Datos no verificados</p>
              <p className="text-xs text-destructive/80">{String(office.data_quality_notes || "")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Data confidence */}
      {dataConfidence && (
        <Alert className="border-primary/20 bg-primary/5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center gap-2 text-xs">
            <span>📊 Confianza de datos: <strong>{dataConfidence}</strong></span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="commercial" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="commercial" className="text-sm">💰 Comercial</TabsTrigger>
          <TabsTrigger value="general" className="text-sm">📋 General</TabsTrigger>
          <TabsTrigger value="process" className="text-sm">⚙️ PI y Proceso</TabsTrigger>
          <TabsTrigger value="fees" className="text-sm">💰 Tasas</TabsTrigger>
          <TabsTrigger value="treaties" className="text-sm">📜 Tratados</TabsTrigger>
          <TabsTrigger value="digital" className="text-sm">🤖 Digital</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-sm">💡 Inteligencia</TabsTrigger>
          <TabsTrigger value="requirements" className="text-sm">📋 Requisitos</TabsTrigger>
        </TabsList>

        <TabsContent value="commercial">
          <DetailTabCommercial officeCode={office.code as string} />
        </TabsContent>
        <TabsContent value="general">
          <DetailTabGeneral office={office} />
        </TabsContent>
        <TabsContent value="process">
          <DetailTabProcess office={office} />
        </TabsContent>
        <TabsContent value="fees">
          <DetailTabFees office={office} />
        </TabsContent>
        <TabsContent value="treaties">
          <DetailTabTreaties office={office} />
        </TabsContent>
        <TabsContent value="digital">
          <DetailTabDigital office={office} />
        </TabsContent>
        <TabsContent value="intelligence">
          <IPOfficeFeeIntelligence officeId={office.id as string} officeName={(office.name_official as string) || (office.name as string)} />
        </TabsContent>
        <TabsContent value="requirements">
          <DetailTabRequirements office={office} />
        </TabsContent>
      </Tabs>
    </div>
  );
}