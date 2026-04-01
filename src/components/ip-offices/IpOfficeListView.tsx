import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { IpOfficeLevelBadge } from "./IpOfficeLevelBadge";
import { ResearchStatusBadge } from "./ResearchStatusBadge";
import type { IpOffice } from "@/hooks/useIpOfficesDirectory";

const JURISDICTION_LABELS: Record<string, string> = { international: "Intl", regional: "Regional", national: "Nacional" };

interface Props {
  offices: IpOffice[];
  researchMap?: Map<string, { status: string; research_completed_at: string | null; auto_confidence_score: number }>;
  onOfficeClick?: (officeId: string) => void;
}

export function IpOfficeListView({ offices, researchMap, onOfficeClick }: Props) {
  const navigate = useNavigate();
  const handleRowClick = (office: IpOffice) => {
    if (onOfficeClick) onOfficeClick(office.id);
    else navigate(`/backoffice/ipo/${office.code}`);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Oficina</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden md:table-cell">Región</TableHead>
            <TableHead className="hidden lg:table-cell">Nivel</TableHead>
            <TableHead className="hidden sm:table-cell text-center">™</TableHead>
            <TableHead className="hidden sm:table-cell text-center">P</TableHead>
            <TableHead className="hidden sm:table-cell text-center">D</TableHead>
            <TableHead className="hidden lg:table-cell text-center">Madrid</TableHead>
            <TableHead className="hidden lg:table-cell text-center">Digital</TableHead>
            <TableHead className="hidden md:table-cell text-center">Datos</TableHead>
            
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map((office) => {
            const scope = (office.office_type || "national") as string;
            const isMadrid = office.member_madrid_protocol ?? false;
            const digitalScore = office.digital_maturity_score ?? 0;
            return (
              <TableRow key={office.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(office)}>
                <TableCell className="text-xl">{office.country_flag || "🏛️"}</TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{office.acronym || office.code}</span>
                      {(office as any).has_fee_intelligence && (
                        <Badge variant="outline" className="text-[10px] h-4 gap-0.5 px-1"><Sparkles className="h-2.5 w-2.5 text-amber-500" />Tasas</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{office.official_name_local || office.name}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{JURISDICTION_LABELS[scope] || scope}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{office.region || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell"><IpOfficeLevelBadge level={office.digitalization_level} variant="compact" /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><BoolIcon value={office.handles_trademarks} /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><BoolIcon value={office.handles_patents} /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><BoolIcon value={office.handles_designs} /></TableCell>
                <TableCell className="hidden lg:table-cell text-center"><BoolIcon value={isMadrid} /></TableCell>
                <TableCell className="hidden lg:table-cell text-center text-xs font-medium">{digitalScore > 0 ? `${digitalScore}/10` : "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {(() => {
                    const score = (office as any).data_completeness_score ?? 0;
                    if (score === 0) return <span className="text-xs text-muted-foreground">—</span>;
                    const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
                    const icon = score >= 80 ? "🟢" : score >= 50 ? "🟡" : "🔴";
                    return <span className={cn("text-xs font-medium", color)}>{icon} {score}%</span>;
                  })()}
                </TableCell>
                <TableCell className="hidden md:table-cell"><ResearchStatusBadge research={researchMap?.get(office.id)} compact /></TableCell>
                <TableCell>
                  {(office.website_main || office.website_url) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open((office.website_main || office.website_url) as string, "_blank"); }}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function BoolIcon({ value }: { value?: boolean | null }) {
  return value ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
}
