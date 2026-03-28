/**
 * SP05-C1 — Brand Risk Dashboard
 * KPIs, temporal chart, donut by channel, top 5 incidents table
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Eye, Bell, Globe, ChevronRight } from 'lucide-react';
import GeoRiskMap from '@/components/spider/GeoRiskMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const DIM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  registral: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'R' },
  similarity: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'R' },
  visual: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'V' },
  social: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'D' },
  domain: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'D' },
  online: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'D' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#94a3b8',
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Nuevo', cls: 'bg-blue-100 text-blue-700' },
  actioned: { label: 'Accionado', cls: 'bg-amber-100 text-amber-700' },
  investigating: { label: 'Investigando', cls: 'bg-violet-100 text-violet-700' },
  resolved: { label: 'Resuelto', cls: 'bg-green-100 text-green-700' },
};

const CATEGORY_LABELS: Record<string, string> = {
  similarity: 'Registral',
  online: 'Digital',
  visual: 'Visual',
  competitor: 'Competidor',
  official: 'Oficial',
};

const CATEGORY_COLORS: Record<string, string> = {
  similarity: '#3B82F6',
  online: '#14B8A6',
  visual: '#8B5CF6',
  competitor: '#F59E0B',
  official: '#6366F1',
};

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

export default function SpiderBrandDashboard() {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();

  const [watches, setWatches] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  // ── Load data ──
  useEffect(() => {
    if (!organizationId) return;
    loadDashboardData();
  }, [organizationId]);

  async function loadDashboardData() {
    const [watchesRes, incidentsRes, alertsRes, configRes] = await Promise.allSettled([
      supabase.from('spider_watches')
        .select('id, is_active')
        .eq('organization_id', organizationId),
      supabase.from('spider_incidents')
        .select('id, risk_score_unified, severity, status, alert_count, alert_ids, entity_name, sources, first_detected_at')
        .eq('organization_id', organizationId),
      supabase.from('spider_alerts')
        .select('id, combined_score, severity, status, alert_category, created_at, detected_jurisdiction')
        .eq('organization_id', organizationId),
      supabase.from('spider_tenant_config')
        .select('plan_code, max_watches, alerts_this_month, max_alerts_per_month')
        .eq('organization_id', organizationId)
        .single(),
    ]);

    setWatches(watchesRes.status === 'fulfilled' ? (watchesRes.value?.data ?? []) : []);
    setIncidents(incidentsRes.status === 'fulfilled' ? (incidentsRes.value?.data ?? []) : []);
    setAlerts(alertsRes.status === 'fulfilled' ? (alertsRes.value?.data ?? []) : []);
    setConfig(configRes.status === 'fulfilled' ? configRes.value?.data : null);
    setIsDataLoaded(watchesRes.status === 'fulfilled' && incidentsRes.status === 'fulfilled');
  }

  // ── KPI calculations ──
  const activeWatches = watches.filter(w => w.is_active).length;
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const portfolioRiskScore = activeIncidents.length > 0
    ? Math.round(activeIncidents.reduce((sum, i) => sum + (i.risk_score_unified ?? 0), 0) / activeIncidents.length)
    : 0;
  const criticalCount = activeIncidents.filter(i => i.severity === 'critical').length;
  const maxWatches = config?.max_watches ?? 15;
  const alertsThisMonth = config?.alerts_this_month ?? 0;
  const maxAlerts = config?.max_alerts_per_month ?? 100;

  // ── Chart data ──
  const dates = getLast30Days();
  const alertsByDate = alerts.reduce((acc: Record<string, number[]>, alert) => {
    const date = new Date(alert.created_at).toLocaleDateString('en-CA');
    if (!acc[date]) acc[date] = [];
    acc[date].push(alert.combined_score ?? 0);
    return acc;
  }, {});

  const scoreData = dates.map(date => {
    const scores = alertsByDate[date];
    if (!scores?.length) return null;
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  });

  const alertCountData = dates.map(date => alertsByDate[date]?.length ?? 0);

  // ── Category donut data ──
  const categoryData = alerts.reduce((acc: Record<string, number>, alert) => {
    const cat = alert.alert_category ?? 'unknown';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const catLabels = Object.keys(categoryData);
  const catValues = Object.values(categoryData) as number[];
  const catColors = catLabels.map(k => CATEGORY_COLORS[k] ?? '#94A3B8');
  const total = catValues.reduce((s, v) => s + v, 0);

  // ── Top 5 incidents ──
  const topIncidents = [...incidents]
    .sort((a, b) => (b.risk_score_unified ?? 0) - (a.risk_score_unified ?? 0))
    .slice(0, 5);

  // ── Charts rendering ──
  useEffect(() => {
    if (!isDataLoaded || !lineChartRef.current) return;

    const existing = Chart.getChart(lineChartRef.current);
    if (existing) existing.destroy();

    new Chart(lineChartRef.current, {
      type: 'line',
      data: {
        labels: dates.map(d => { const [, m, day] = d.split('-'); return day + '/' + m; }),
        datasets: [
          {
            label: 'Score medio',
            data: scoreData,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139,92,246,0.08)',
            fill: true,
            tension: 0.4,
            spanGaps: false,
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#8B5CF6',
            pointRadius: scoreData.map(s => s === null ? 0 : 5),
            pointHoverRadius: 7,
          },
          {
            label: 'Nº alertas',
            data: alertCountData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.05)',
            fill: false,
            tension: 0.3,
            yAxisID: 'y2',
            pointBackgroundColor: '#3B82F6',
            pointRadius: alertCountData.map(v => v > 0 ? 4 : 0),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { color: '#64748B', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
          y2: { position: 'right', min: 0, ticks: { stepSize: 1, color: '#3B82F6', font: { size: 11 } }, grid: { display: false } },
          x: { ticks: { color: '#64748B', font: { size: 10 }, maxTicksLimit: 10 }, grid: { display: false } },
        },
      },
    });
  }, [isDataLoaded, alerts]);

  useEffect(() => {
    if (!isDataLoaded || !donutChartRef.current || catLabels.length === 0) return;

    const existing = Chart.getChart(donutChartRef.current);
    if (existing) existing.destroy();

    new Chart(donutChartRef.current, {
      type: 'doughnut',
      data: {
        labels: catLabels.map(k => CATEGORY_LABELS[k] ?? k),
        datasets: [{
          data: catValues,
          backgroundColor: catColors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '70%',
      },
    });
  }, [isDataLoaded, alerts]);

  // ── Helpers ──
  function getRiskColor(score: number) {
    if (score > 75) return '#EF4444';
    if (score > 50) return '#F59E0B';
    return '#22C55E';
  }

  function getProgressColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return undefined; // use default
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <button onClick={() => navigate('/app/spider')} className="hover:underline">IP-SPIDER</button>
            <ChevronRight className="w-3 h-3" />
            <span>Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Brand Risk Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visión global del portfolio vigilado</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/spider')}>
          ← IP-SPIDER
        </Button>
      </div>

      {/* ── Contextual banner ── */}
      {isDataLoaded && criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-red-700 text-sm font-medium">
            ⚠ {criticalCount} incidente(s) crítico(s) requieren acción inmediata
          </span>
          <button onClick={() => navigate('/app/spider')} className="text-red-700 text-sm underline hover:no-underline">
            Ver ahora →
          </button>
        </div>
      )}
      {isDataLoaded && criticalCount === 0 && activeIncidents.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-700 text-sm font-medium">
            ✓ Portfolio en estado óptimo — Sin incidentes activos
          </span>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Portfolio Risk */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          {!isDataLoaded ? <Skeleton className="h-20 w-full rounded-xl" /> : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" style={{ color: getRiskColor(portfolioRiskScore) }} />
                <span className="font-medium uppercase tracking-wide">Riesgo Portfolio</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: getRiskColor(portfolioRiskScore) }}>
                {portfolioRiskScore}
              </div>
              <p className="text-xs text-muted-foreground">{activeIncidents.length} incidentes activos</p>
            </>
          )}
        </div>

        {/* KPI 2: Active Incidents */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          {!isDataLoaded ? <Skeleton className="h-20 w-full rounded-xl" /> : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="w-4 h-4" style={{ color: criticalCount > 0 ? '#EF4444' : undefined }} />
                <span className="font-medium uppercase tracking-wide">Incidentes Activos</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{activeIncidents.length}</div>
              {criticalCount > 0 && (
                <p className="text-xs text-red-600 font-medium">{criticalCount} crítico(s)</p>
              )}
            </>
          )}
        </div>

        {/* KPI 3: Watches */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          {!isDataLoaded ? <Skeleton className="h-20 w-full rounded-xl" /> : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                <span className="font-medium uppercase tracking-wide">Vigilancias</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{activeWatches} / {maxWatches}</div>
              <Progress
                value={(activeWatches / maxWatches) * 100}
                stateColor={getProgressColor((activeWatches / maxWatches) * 100) ?? '#8B5CF6'}
                className="h-1.5"
              />
            </>
          )}
        </div>

        {/* KPI 4: Alerts this month */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          {!isDataLoaded ? <Skeleton className="h-20 w-full rounded-xl" /> : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <span className="font-medium uppercase tracking-wide">Alertas este mes</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{alertsThisMonth} / {maxAlerts}</div>
              <Progress
                value={(alertsThisMonth / maxAlerts) * 100}
                stateColor={getProgressColor((alertsThisMonth / maxAlerts) * 100) ?? '#3B82F6'}
                className="h-1.5"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Temporal chart ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Evolución del riesgo — últimos 30 días</h3>
        {!isDataLoaded ? (
          <Skeleton className="h-[280px] w-full rounded-xl" />
        ) : (
          <>
            <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-violet-500 inline-block rounded" />
                Score medio (eje izq.)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
                Nº alertas (eje der.)
              </span>
            </div>
            <div style={{ position: 'relative', height: '280px', width: '100%' }}>
              <canvas ref={lineChartRef} />
            </div>
          </>
        )}
      </div>

      {/* ── Donut + Map placeholder ── */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* Donut by channel — compact */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Alertas por canal</h3>
          {!isDataLoaded ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : catLabels.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sin alertas registradas</p>
          ) : (
            <>
              <div style={{ position: 'relative', height: '200px', width: '200px', margin: '0 auto' }}>
                <canvas ref={donutChartRef} />
              </div>
              <div className="space-y-1 mt-3">
                {catLabels.map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColors[i] }} />
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="text-muted-foreground">
                      {catValues[i]} ({total > 0 ? Math.round(catValues[i] / total * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Geographic Risk Map — SP05-C2 */}
        <div className="md:col-span-3 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribución geográfica</h3>
          <GeoRiskMap
            alerts={alerts}
            onCountryClick={() => navigate('/app/spider')}
          />
        </div>
      </div>

      {/* ── Top 5 incidents table ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top incidentes por riesgo</h3>
        {!isDataLoaded ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
          </div>
        ) : topIncidents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Sin incidentes registrados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Canales</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detectado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topIncidents.map(inc => {
                const statusInfo = STATUS_LABELS[inc.status] ?? { label: inc.status, cls: 'bg-muted text-muted-foreground' };
                return (
                  <TableRow key={inc.id}>
                    <TableCell className="font-medium text-foreground">{inc.entity_name ?? '—'}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center justify-center w-10 h-7 rounded-md text-white text-xs font-bold"
                        style={{ background: getRiskColor(inc.risk_score_unified ?? 0) }}
                      >
                        {inc.risk_score_unified ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(inc.sources ?? []).map((s: string) => {
                          const dim = DIM_COLORS[s];
                          return dim ? (
                            <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${dim.bg} ${dim.text}`}>
                              {dim.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inc.first_detected_at
                        ? formatDistanceToNow(new Date(inc.first_detected_at), { addSuffix: true, locale: es })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-violet-600 hover:text-violet-700 text-xs"
                        onClick={() => {
                          if ((inc.alert_count ?? 0) >= 2) {
                            navigate(`/app/spider/incidents/${inc.id}`);
                          } else {
                            const firstAlertId = inc.alert_ids?.[0];
                            if (firstAlertId) navigate(`/app/spider/alerts/${firstAlertId}`);
                          }
                        }}
                      >
                        Ver →
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
