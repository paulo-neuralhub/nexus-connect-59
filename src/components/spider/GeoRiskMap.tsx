/**
 * SP05-C2 — Geographic Risk Map using D3 + native GeoJSON
 * Renders a world map colored by registral alert risk scores.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Globe, Loader2 } from 'lucide-react';

// Module-level cache — persists across re-renders
let cachedGeoJson: any = null;

// ─── Jurisdiction → ISO Alpha-3 mapping ───
const JURISDICTION_TO_ISO: Record<string, string[]> = {
  'EU': ['AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN','IRL','ITA','LVA','LTU','LUX','MLT','NLD','POL','PRT','ROU','SVK','SVN','ESP','SWE'],
  'EM': ['AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN','IRL','ITA','LVA','LTU','LUX','MLT','NLD','POL','PRT','ROU','SVK','SVN','ESP','SWE'],
  'ES': ['ESP'], 'US': ['USA'], 'GB': ['GBR'], 'DE': ['DEU'], 'FR': ['FRA'],
  'JP': ['JPN'], 'CN': ['CHN'], 'MX': ['MEX'], 'BR': ['BRA'], 'AU': ['AUS'],
  'CA': ['CAN'], 'IN': ['IND'], 'KR': ['KOR'], 'IT': ['ITA'], 'PT': ['PRT'],
  'NL': ['NLD'], 'BE': ['BEL'], 'CH': ['CHE'],
  'WO': [], 'AP': [], 'EA': [], 'OA': [],
};

const ISO_TO_NAME: Record<string, string> = {
  'ESP': 'España', 'USA': 'Estados Unidos', 'DEU': 'Alemania', 'FRA': 'Francia',
  'GBR': 'Reino Unido', 'ITA': 'Italia', 'PRT': 'Portugal', 'NLD': 'Países Bajos',
  'BEL': 'Bélgica', 'JPN': 'Japón', 'CHN': 'China', 'BRA': 'Brasil',
  'MEX': 'México', 'AUS': 'Australia', 'CAN': 'Canadá', 'IND': 'India',
  'KOR': 'Corea del Sur', 'CHE': 'Suiza', 'AUT': 'Austria', 'POL': 'Polonia',
  'CZE': 'República Checa', 'HUN': 'Hungría', 'ROU': 'Rumanía', 'BGR': 'Bulgaria',
  'HRV': 'Croacia', 'SVK': 'Eslovaquia', 'SVN': 'Eslovenia', 'EST': 'Estonia',
  'LVA': 'Letonia', 'LTU': 'Lituania', 'CYP': 'Chipre', 'MLT': 'Malta',
  'IRL': 'Irlanda', 'GRC': 'Grecia', 'DNK': 'Dinamarca', 'FIN': 'Finlandia',
  'SWE': 'Suecia', 'LUX': 'Luxemburgo',
};

function getRiskColor(score: number | undefined): string {
  if (!score || score === 0) return '#E2E8F0';
  if (score >= 85) return '#DC2626';
  if (score >= 70) return '#D97706';
  if (score >= 50) return '#2563EB';
  return '#7C3AED';
}

const EXCLUDED_CATEGORIES = new Set(['online', 'social', 'domain', 'marketplace']);

function buildRiskByISO(
  alerts: GeoRiskMapProps['alerts']
): Record<string, { score: number; alertCount: number }> {
  const riskMap: Record<string, { score: number; alertCount: number }> = {};
  for (const alert of alerts) {
    const jurisdiction = alert.detected_jurisdiction;
    if (!jurisdiction) continue;
    if (EXCLUDED_CATEGORIES.has(alert.alert_category ?? '')) continue;
    const isoCodes = JURISDICTION_TO_ISO[jurisdiction] ?? [];
    const score = alert.combined_score ?? 0;
    for (const iso of isoCodes) {
      if (!riskMap[iso]) riskMap[iso] = { score: 0, alertCount: 0 };
      riskMap[iso].score = Math.max(riskMap[iso].score, score);
      riskMap[iso].alertCount += 1;
    }
  }
  return riskMap;
}

// ─── Props ───
interface GeoRiskMapProps {
  alerts: Array<{
    detected_jurisdiction: string | null;
    combined_score: number | null;
    alert_category: string | null;
  }>;
  onCountryClick?: (iso: string) => void;
}

export default function GeoRiskMap({ alerts, onCountryClick }: GeoRiskMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(cachedGeoJson);
  const [loadError, setLoadError] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number;
    name: string; score: number; alertCount: number;
  }>({ visible: false, x: 0, y: 0, name: '', score: 0, alertCount: 0 });

  const alertsKey = JSON.stringify(
    alerts.map(a => ({ j: a.detected_jurisdiction, s: a.combined_score, c: a.alert_category }))
  );
  const riskByISO = useMemo(() => buildRiskByISO(alerts), [alertsKey]);
  const hasRegistralData = Object.values(riskByISO).some(v => v.score > 0);
  const graticuleData = useMemo(() => d3.geoGraticule()(), []);

  // ─── Fetch GeoJSON ───
  useEffect(() => {
    if (cachedGeoJson) return;
    let mounted = true;
    const controller = new AbortController();
    fetch(
      'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
      { signal: controller.signal }
    )
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { if (!mounted) return; cachedGeoJson = data; setGeoData(data); })
      .catch(err => { if (!mounted || err.name === 'AbortError') return; setLoadError(true); });
    return () => { mounted = false; controller.abort(); };
  }, []);

  // ─── LEVEL 0: No registral data ───
  if (geoData && !hasRegistralData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Globe className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin alertas registrales activas</p>
        <p className="text-xs text-muted-foreground/60 mt-1">El mapa se activa cuando se detecten similitudes en registros oficiales</p>
      </div>
    );
  }

  // ─── LEVEL 1: Loading ───
  if (!geoData && !loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground">Cargando mapa...</span>
      </div>
    );
  }

  // ─── LEVEL 3: Error fallback table ───
  if (loadError) {
    const summaryEntries = Object.entries(
      (alerts ?? [])
        .filter(a => !EXCLUDED_CATEGORIES.has(a.alert_category ?? ''))
        .reduce((acc: Record<string, number>, alert) => {
          const j = alert.detected_jurisdiction;
          if (!j || ['WO','AP','EA','OA'].includes(j)) return acc;
          acc[j] = Math.max(acc[j] ?? 0, alert.combined_score ?? 0);
          return acc;
        }, {})
    ).sort(([, a], [, b]) => b - a);

    return (
      <div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
          <Globe className="w-3.5 h-3.5" />
          Vista de tabla (mapa no disponible)
        </p>
        <div className="space-y-2" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
          {summaryEntries.map(([jurisdiction, score]) => (
            <div key={jurisdiction} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
              <span className="text-sm font-medium text-foreground">{jurisdiction}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${score}%`, background: getRiskColor(score) }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">{score}%</span>
              </div>
            </div>
          ))}
          {summaryEntries.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Sin jurisdicciones registrales</p>
          )}
        </div>
      </div>
    );
  }

  // ─── LEVEL 2: D3 Map with native GeoJSON ───
  const projection = d3.geoNaturalEarth1().scale(130).translate([300, 160]);
  const pathGenerator = d3.geoPath().projection(projection);

  return (
    <div className="relative">
      <div style={{ aspectRatio: '600 / 320' }} className="relative w-full">
        <svg ref={svgRef} viewBox="0 0 600 320" className="w-full h-full">
          <rect width="600" height="320" fill="hsl(var(--muted))" rx="8" />
          <path d={pathGenerator(graticuleData) ?? ''} fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" />
          {(geoData.features ?? []).map((feature: any) => {
            const iso = feature.properties?.ISO_A3;
            if (!iso) return null;
            const riskData = riskByISO[iso];
            const score = riskData?.score;
            const alertCount = riskData?.alertCount ?? 0;
            const color = getRiskColor(score);
            const isAtRisk = score != null && score > 0;
            const pathD = pathGenerator(feature as any);
            if (!pathD) return null;
            return (
              <path
                key={iso}
                d={pathD}
                fill={color}
                stroke="hsl(var(--background))"
                strokeWidth="0.5"
                style={{ cursor: isAtRisk ? 'pointer' : 'default', transition: 'fill 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isAtRisk) return;
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    visible: true,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: ISO_TO_NAME[iso] ?? feature.properties?.ADMIN ?? iso,
                    score: score ?? 0,
                    alertCount,
                  });
                }}
                onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                onClick={() => { if (isAtRisk && onCountryClick) onCountryClick(iso); }}
              />
            );
          })}
        </svg>

        {tooltip.visible && (
          <div
            className="absolute z-50 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <p className="text-sm font-semibold text-foreground">{tooltip.name}</p>
            <p className="text-xs text-muted-foreground">
              Riesgo: <span className="font-medium" style={{ color: getRiskColor(tooltip.score) }}>{tooltip.score}%</span>
            </p>
            <p className="text-xs text-muted-foreground">{tooltip.alertCount} alerta(s) · Click para ver</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
        Basado en jurisdicción de registro. El riesgo efectivo depende de los mercados activos.
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground justify-center">
        <span className="font-medium">Riesgo:</span>
        {[
          { color: '#DC2626', label: 'Crítico ≥85%' },
          { color: '#D97706', label: 'Alto ≥70%' },
          { color: '#2563EB', label: 'Medio ≥50%' },
          { color: '#7C3AED', label: 'Bajo >0%' },
          { color: '#E2E8F0', label: 'Sin alertas' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
