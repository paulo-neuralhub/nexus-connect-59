import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle, ClipboardCheck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface IpOfficeBasic {
  [key: string]: unknown;
  id: string; code: string; name: string;
  country?: string | null; country_name?: string | null; region?: string | null;
  digitalization_level?: string | null; website_url?: string | null; automation_percentage?: number | null;
}

interface Props { offices: IpOfficeBasic[]; }

const KEY_OFFICES = [
  { code: "WO", name: "WIPO", expectedLevel: "FULL_DIGITAL" },
  { code: "EP", name: "EPO", expectedLevel: "FULL_DIGITAL" },
  { code: "EM", name: "EUIPO", expectedLevel: "FULL_DIGITAL" },
  { code: "US", name: "USPTO", expectedLevel: "AVANZADA" },
  { code: "AU", name: "IP Australia", expectedLevel: "FULL_DIGITAL" },
  { code: "JP", name: "JPO", expectedLevel: "AVANZADA" },
  { code: "KR", name: "KIPO", expectedLevel: "AVANZADA" },
  { code: "CA", name: "CIPO", expectedLevel: "AVANZADA" },
  { code: "DE", name: "DPMA", expectedLevel: "AVANZADA" },
  { code: "FR", name: "INPI Francia", expectedLevel: "AVANZADA" },
  { code: "CN", name: "CNIPA", expectedLevel: "AVANZADA" },
  { code: "MX", name: "IMPI", expectedLevel: "PARCIAL" },
  { code: "BR", name: "INPI Brasil", expectedLevel: "PARCIAL" },
  { code: "ES", name: "OEPM", expectedLevel: "AVANZADA" },
  { code: "GB", name: "UKIPO", expectedLevel: "AVANZADA" },
];

const VALID_LEVELS = ["FULL_DIGITAL", "AVANZADA", "PARCIAL", "BASICA", "MANUAL"];
type CheckStatus = "pass" | "warn" | "fail";
interface AuditCheck { label: string; status: CheckStatus; detail: string; items?: string[]; }

export function IpOfficeAuditPanel({ offices }: Props) {
  const [open, setOpen] = useState(false);
  const checks = useMemo<AuditCheck[]>(() => {
    const result: AuditCheck[] = [];
    const total = offices.length;
    result.push({ label: "Total oficinas", status: total >= 190 ? "pass" : total >= 150 ? "warn" : "fail", detail: `${total} oficinas en la base de datos` });

    const byLevel: Record<string, number> = {};
    const invalidLevel: string[] = [];
    offices.forEach(o => { const lev = o.digitalization_level || "NULL"; if (!VALID_LEVELS.includes(lev) && lev !== "NULL") invalidLevel.push(`${o.code}: "${lev}"`); byLevel[lev] = (byLevel[lev] || 0) + 1; });
    const nullCount = byLevel["NULL"] || 0;
    result.push({ label: "Niveles de digitalización", status: nullCount === 0 && invalidLevel.length === 0 ? "pass" : nullCount > 5 ? "fail" : "warn",
      detail: `🟢 Full: ${byLevel.FULL_DIGITAL || 0} | 🔵 Avz: ${byLevel.AVANZADA || 0} | 🟡 Par: ${byLevel.PARCIAL || 0} | 🟠 Bás: ${byLevel.BASICA || 0} | 🔴 Man: ${byLevel.MANUAL || 0}${nullCount ? ` | ⚠️ NULL: ${nullCount}` : ""}`,
      items: invalidLevel.length ? invalidLevel : undefined });

    const codeMap = new Map<string, string[]>();
    offices.forEach(o => { const list = codeMap.get(o.code) || []; list.push(o.name); codeMap.set(o.code, list); });
    const dupes = Array.from(codeMap.entries()).filter(([, v]) => v.length > 1);
    result.push({ label: "Duplicados por código", status: dupes.length === 0 ? "pass" : "fail", detail: dupes.length === 0 ? "Sin duplicados" : `${dupes.length} códigos duplicados`, items: dupes.map(([code, names]) => `${code}: ${names.join(", ")}`) });

    const byRegion: Record<string, number> = {};
    offices.forEach(o => { const r = o.region || "NULL"; byRegion[r] = (byRegion[r] || 0) + 1; });
    result.push({ label: "Distribución por región", status: "pass", detail: Object.entries(byRegion).map(([r, c]) => `${r}: ${c}`).join(" | ") });

    const missingName = offices.filter(o => !o.name).map(o => o.code);
    const missingRegion = offices.filter(o => !o.region).map(o => o.code);
    const criticalMissing = missingName.length + missingRegion.length;
    result.push({ label: "Campos críticos", status: criticalMissing === 0 ? "pass" : "fail", detail: `Sin nombre: ${missingName.length} | Sin región: ${missingRegion.length}` });

    const officeMap = new Map(offices.map(o => [o.code, o]));
    const keyMissing: string[] = []; const keyWrongLevel: string[] = []; let keyFound = 0;
    KEY_OFFICES.forEach(({ code, name, expectedLevel }) => {
      const found = officeMap.get(code);
      if (!found) keyMissing.push(`${code} (${name}) — NO ENCONTRADA`);
      else { keyFound++; if (found.digitalization_level !== expectedLevel) keyWrongLevel.push(`${code}: actual="${found.digitalization_level}" esperado="${expectedLevel}"`); }
    });
    result.push({ label: `Oficinas clave (${keyFound}/${KEY_OFFICES.length})`, status: keyMissing.length === 0 && keyWrongLevel.length === 0 ? "pass" : keyMissing.length > 0 ? "fail" : "warn",
      detail: keyMissing.length === 0 ? "Todas encontradas" : `${keyMissing.length} no encontradas`,
      items: [...keyMissing, ...keyWrongLevel.map(w => `⚠️ Nivel diferente: ${w}`)] });
    return result;
  }, [offices]);

  const passCount = checks.filter(c => c.status === "pass").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (status === "warn") return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn("w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors text-sm hover:bg-muted/50",
          open ? "bg-muted/30 border-border" : "bg-background border-border/60")}>
          <span className="flex items-center gap-2 text-muted-foreground font-medium">
            <ClipboardCheck className="h-4 w-4" />Auditoría de datos
            <Badge variant="secondary" className="text-[10px] ml-1">✅{passCount} ⚠️{warnCount} ❌{failCount}</Badge>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
        {checks.map((check, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-2"><StatusIcon status={check.status} /><span className="text-sm font-medium text-foreground">{check.label}</span></div>
            <p className="text-xs text-muted-foreground ml-6">{check.detail}</p>
            {check.items && check.items.length > 0 && (
              <ul className="ml-6 mt-1 space-y-0.5">
                {check.items.slice(0, 10).map((item, j) => <li key={j} className="text-xs text-muted-foreground/80">• {item}</li>)}
                {check.items.length > 10 && <li className="text-xs text-muted-foreground/60 italic">...y {check.items.length - 10} más</li>}
              </ul>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
