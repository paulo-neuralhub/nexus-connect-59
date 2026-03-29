import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '@/contexts/organization-context'
import { supabase } from '@/integrations/supabase/client'
import {
  FolderOpen, Clock, TrendingUp, Radar, Activity,
  Sparkles, CheckCircle, ChevronRight, AlertTriangle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// ── Interfaces ────────────────────────────────────────

interface DashboardDeadline {
  id: string
  title: string
  deadline_date: string
  status: string
  matter_id: string
  priority: string | null
  matter_title: string | null
  matter_reference: string | null
}

interface DashboardDeal {
  id: string
  name: string
  amount_eur: number | null
  stage: string
  account_name_cache: string | null
}

interface DashboardBriefing {
  id: string
  content_json: any
  created_at: string
  was_read: boolean
}

interface DashboardActivity {
  id: string
  description: string | null
  activity_type: string
  created_at: string
}

interface DashboardData {
  portfolioCount: number
  deadlines: DashboardDeadline[]
  watchCount: number
  alertCount: number
  deals: DashboardDeal[]
  briefing: DashboardBriefing | null
  activities: DashboardActivity[]
}

// ── Helpers puros (fuera del componente) ──────────────

function daysDiff(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round(
    (target.getTime() - now.getTime()) / 86400000
  )
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `€${Math.round(amount / 1000)}K`
  }
  return `€${amount}`
}

function formatRelativeTime(dateStr: string): string {
  const minutes = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000
  )
  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes}m`
  if (minutes < 1440) return `hace ${Math.floor(minutes / 60)}h`
  return `hace ${Math.floor(minutes / 1440)}d`
}

// Health Score basado en ratio (no absolutos)
function calcHealthScore(
  deadlines: DashboardDeadline[]
): number {
  const total = deadlines.length
  if (total === 0) return 100
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const overdueCount = deadlines.filter(d =>
    d.status === 'overdue' ||
    new Date(d.deadline_date) < now
  ).length
  const ratio = overdueCount / total
  return Math.max(20, Math.round(100 - ratio * 80))
}

// Agrupar deadlines por horizonte temporal
function groupDeadlines(deadlines: DashboardDeadline[]) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d1 = new Date(now); d1.setDate(d1.getDate() + 1)
  const d7 = new Date(now); d7.setDate(d7.getDate() + 7)
  const d30 = new Date(now); d30.setDate(d30.getDate() + 30)

  const groups = [
    {
      label: 'VENCIDOS',
      urgency: 'overdue' as const,
      items: deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        date.setHours(0, 0, 0, 0)
        return date < now || d.status === 'overdue'
      })
    },
    {
      label: 'HOY',
      urgency: 'today' as const,
      items: deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        date.setHours(0, 0, 0, 0)
        return date.getTime() === now.getTime() &&
          d.status !== 'overdue'
      })
    },
    {
      label: 'MAÑANA',
      urgency: 'tomorrow' as const,
      items: deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        date.setHours(0, 0, 0, 0)
        return date.getTime() === d1.getTime()
      })
    },
    {
      label: 'ESTA SEMANA',
      urgency: 'week' as const,
      items: deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        date.setHours(0, 0, 0, 0)
        return date > d1 && date <= d7
      })
    },
    {
      label: 'ESTE MES',
      urgency: 'month' as const,
      items: deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        date.setHours(0, 0, 0, 0)
        return date > d7 && date <= d30
      })
    },
  ]

  return groups.filter(g => g.items.length > 0)
}

// Saludo según hora del día
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

// Labels legibles para tipos de actividad
const ACTIVITY_LABELS: Record<string, string> = {
  deadline: 'Plazo actualizado',
  task: 'Tarea creada',
  document: 'Documento subido',
  email: 'Email recibido',
  note: 'Nota añadida',
  stage_change: 'Cambio de etapa',
  crm: 'Actividad CRM',
}

// Componente de número animado
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 600
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  return <>{display}</>
}

// ── Componente principal ──────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [focusMode, setFocusMode] = useState(false)

  // ── Carga de datos con Promise.allSettled ──────────

  useEffect(() => {
    if (!orgId) return
    loadDashboard()
  }, [orgId])

  async function loadDashboard() {
    setIsLoading(true)

    const client: any = supabase

    const [
      mattersRes,
      deadlinesRes,
      watchesRes,
      alertsRes,
      dealsRes,
      briefingRes,
      activitiesRes,
    ] = await Promise.allSettled([

      // Q1: Portfolio total
      client
        .from('matters')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!),

      // Q2: Deadlines con nombre del expediente
      client
        .from('matter_deadlines')
        .select(`
          id, title, deadline_date, status,
          matter_id, priority,
          matter:matters!matter_deadlines_matter_id_fkey(
            id, title, mark_name, reference
          )
        `)
        .eq('organization_id', orgId!)
        .in('status', ['pending', 'overdue'])
        .order('deadline_date', { ascending: true })
        .limit(40),

      // Q3: Spider watches activas
      client
        .from('spider_watches')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('is_active', true),

      // Q4: Alertas nuevas
      client
        .from('spider_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('status', 'new'),

      // Q5: Pipeline activo
      client
        .from('crm_deals')
        .select('id, name, amount_eur, stage, account_name_cache')
        .eq('organization_id', orgId!)
        .not('stage', 'in', '("lost","won")'),

      // Q6: Último briefing del día
      client
        .from('genius_daily_briefings')
        .select('id, content_json, created_at, was_read')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Q7: Actividad reciente
      client
        .from('crm_activities')
        .select('id, activity_type, description, created_at')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Extraer resultados con fallbacks seguros
    const portfolioCount =
      mattersRes.status === 'fulfilled'
        ? (mattersRes.value.count ?? 0) : 0

    const rawDeadlines =
      deadlinesRes.status === 'fulfilled'
        ? (deadlinesRes.value.data ?? []) : []

    const watchCount =
      watchesRes.status === 'fulfilled'
        ? (watchesRes.value.count ?? 0) : 0

    const alertCount =
      alertsRes.status === 'fulfilled'
        ? (alertsRes.value.count ?? 0) : 0

    const deals =
      dealsRes.status === 'fulfilled'
        ? (dealsRes.value.data ?? []) : []

    const briefing =
      briefingRes.status === 'fulfilled'
        ? briefingRes.value.data : null

    const rawActivities =
      activitiesRes.status === 'fulfilled'
        ? (activitiesRes.value.data ?? []) : []

    // Normalizar deadlines con nombre del expediente
    const deadlines: DashboardDeadline[] = rawDeadlines.map(
      (d: any) => ({
        id: d.id,
        title: d.title,
        deadline_date: d.deadline_date,
        status: d.status,
        matter_id: d.matter_id,
        priority: d.priority,
        matter_title:
          d.matter?.mark_name ||
          d.matter?.title ||
          d.matter?.reference ||
          null,
        matter_reference: d.matter?.reference || null,
      })
    )

    // Fallback: si crm_activities vacía, usar deadlines como proxy
    const activities: DashboardActivity[] =
      rawActivities.length > 0
        ? rawActivities.map((a: any) => ({
            id: a.id,
            activity_type: a.activity_type,
            description: a.description,
            created_at: a.created_at,
          }))
        : deadlines.slice(0, 5).map(d => ({
            id: d.id,
            activity_type: 'deadline',
            description: `Plazo: ${d.title}${
              d.matter_title ? ` — ${d.matter_title}` : ''
            }`,
            created_at: d.deadline_date,
          }))

    setData({
      portfolioCount,
      deadlines,
      watchCount,
      alertCount,
      deals: deals as DashboardDeal[],
      briefing: briefing as DashboardBriefing | null,
      activities,
    })

    setIsLoading(false)
  }

  // ── Valores computados ─────────────────────────────

  const pipelineValue = useMemo(() =>
    (data?.deals ?? []).reduce(
      (sum, d) => sum + (d.amount_eur ?? 0), 0
    ), [data?.deals]
  )

  const dealCount = useMemo(() =>
    (data?.deals ?? []).length,
    [data?.deals]
  )

  const healthScore = useMemo(() =>
    data ? calcHealthScore(data.deadlines) : 100,
    [data?.deadlines]
  )

  const groupedDeadlines = useMemo(() =>
    data ? groupDeadlines(data.deadlines) : [],
    [data?.deadlines]
  )

  const criticalDeadlines = useMemo(() => {
    if (!data) return []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return data.deadlines.filter(d => {
      const date = new Date(d.deadline_date)
      date.setHours(0, 0, 0, 0)
      return date <= tomorrow || d.status === 'overdue'
    })
  }, [data?.deadlines])

  const weekDeadlineCount = useMemo(() => {
    if (!data) return 0
    const now = new Date()
    const d7 = new Date(now)
    d7.setDate(d7.getDate() + 7)
    return data.deadlines.filter(d =>
      new Date(d.deadline_date) <= d7
    ).length
  }, [data?.deadlines])

  const deadlineBreakdown = useMemo(() => {
    if (!data) return { overdue: 0, week: 0, ok: 0 }
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const d7 = new Date(now)
    d7.setDate(d7.getDate() + 7)
    return {
      overdue: data.deadlines.filter(d =>
        d.status === 'overdue' ||
        new Date(d.deadline_date) < now
      ).length,
      week: data.deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        return date >= now && date <= d7 &&
          d.status !== 'overdue'
      }).length,
      ok: data.deadlines.filter(d => {
        const date = new Date(d.deadline_date)
        return date > d7
      }).length,
    }
  }, [data?.deadlines])

  // ── RENDER ─────────────────────────────────────────

  return (
    <div className="min-h-full" style={{ background: '#EEF2F7', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

        {/* ── HEADER ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              {getGreeting()} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric',
                month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {weekDeadlineCount > 0 && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                {weekDeadlineCount} plazos esta semana
              </span>
            )}
            <button
              title={focusMode ? 'Desactivar modo Focus' : 'Activar modo Focus'}
              onClick={() => setFocusMode(!focusMode)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                focusMode
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              ◎ {focusMode ? 'Focus ON' : 'Focus'}
            </button>
          </div>
        </div>

        {/* ── ZONA CRÍTICA ─────────────────────────────── */}
        {criticalDeadlines.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-[14px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                Requiere atención inmediata
              </span>
              <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                {criticalDeadlines.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {criticalDeadlines.slice(0, 5).map(d => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/app/expedientes/${d.matter_id}`)}
                  className="shrink-0 bg-white border border-red-100 rounded-xl px-3 py-2 text-left hover:border-red-300 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                    {d.matter_title || d.matter_reference || d.title}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {d.status === 'overdue' ? 'Vencido' : 'Vence hoy'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 5 KPIs ───────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {isLoading ? (
            <>
              {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-[110px] rounded-[14px]" />
              ))}
            </>
          ) : (
            <>
              {/* KPI 1 — Portfolio */}
              <button
                onClick={() => navigate('/app/expedientes')}
                className="bg-white rounded-[14px] p-4 text-left shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff] hover:shadow-[6px_6px_14px_#cdd1dc,-6px_-6px_14px_#ffffff] transition-all col-span-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolio</span>
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-800 tabular-nums" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <AnimatedNumber value={data?.portfolioCount ?? 0} />
                </p>
                <p className="text-xs text-slate-400 mt-1">expedientes activos</p>
              </button>

              {/* KPI 2 — En riesgo */}
              <button
                onClick={() => navigate('/app/deadlines')}
                className="bg-white rounded-[14px] p-4 text-left shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff] hover:shadow-[6px_6px(14px_#cdd1dc,-6px_-6px_14px_#ffffff] transition-all col-span-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En riesgo</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-slate-800 tabular-nums" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <AnimatedNumber value={weekDeadlineCount} />
                </p>
                <p className="text-xs text-slate-400 mt-1">próximos 7 días</p>
              </button>

              {/* KPI 3 — Pipeline */}
              <button
                onClick={() => navigate('/app/crm/kanban')}
                className="bg-white rounded-[14px] p-4 text-left shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff] hover:shadow-[6px_6px_14px_#cdd1dc,-6px_-6px_14px_#ffffff] transition-all col-span-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-800 tabular-nums" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {formatCurrency(pipelineValue)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {dealCount} deal{dealCount !== 1 ? 's' : ''} activo{dealCount !== 1 ? 's' : ''}
                </p>
              </button>

              {/* KPI 4 — Vigilancias */}
              <button
                onClick={() => navigate('/app/spider')}
                className="bg-white rounded-[14px] p-4 text-left shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff] hover:shadow-[6px_6px_14px_#cdd1dc,-6px_-6px_14px_#ffffff] transition-all col-span-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vigilancias</span>
                  <Radar className="h-4 w-4 text-violet-500" />
                </div>
                <p className="text-3xl font-bold text-slate-800 tabular-nums" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <AnimatedNumber value={data?.watchCount ?? 0} />
                </p>
                <p className={`text-xs mt-1 ${
                  (data?.alertCount ?? 0) > 0 ? 'text-violet-600 font-medium' : 'text-slate-400'
                }`}>
                  {(data?.alertCount ?? 0) > 0
                    ? `${data?.alertCount} alerta${(data?.alertCount ?? 0) !== 1 ? 's' : ''} nueva${(data?.alertCount ?? 0) !== 1 ? 's' : ''}`
                    : 'sin alertas nuevas'}
                </p>
              </button>

              {/* KPI 5 — Health Score */}
              <div className="bg-white rounded-[14px] p-4 text-left shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff] col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salud</span>
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                <p className={`text-3xl font-bold tabular-nums ${
                  healthScore >= 75 ? 'text-emerald-600'
                  : healthScore >= 50 ? 'text-amber-600'
                  : 'text-red-600'
                }`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {healthScore}
                  <span className="text-lg font-normal text-slate-400">/100</span>
                </p>
                <p className={`text-xs mt-1 ${
                  healthScore >= 75 ? 'text-emerald-600'
                  : healthScore >= 50 ? 'text-amber-600'
                  : 'text-red-600'
                }`}>
                  {healthScore >= 75 ? 'Buen estado'
                   : healthScore >= 50 ? 'Atención requerida'
                   : 'Estado crítico'}
                </p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      healthScore >= 75 ? 'bg-emerald-500'
                      : healthScore >= 50 ? 'bg-amber-500'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── CONTENIDO PRINCIPAL ──────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-[300px] rounded-[14px]" />
              <Skeleton className="h-[250px] rounded-[14px]" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-[280px] rounded-[14px]" />
              <Skeleton className="h-[200px] rounded-[14px]" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-[400px] rounded-[14px]" />
            </div>
          </div>
        ) : !focusMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">

            {/* Columna izquierda — 5/12 */}
            <div className="lg:col-span-5 space-y-4">

              {/* Plazos próximos */}
              <div className="bg-white rounded-[14px] p-5 shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800">
                    Plazos próximos
                  </h2>
                  <button
                    onClick={() => navigate('/app/deadlines')}
                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="space-y-3">
                  {groupedDeadlines.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">
                        Sin plazos urgentes
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        El portfolio está al día
                      </p>
                    </div>
                  ) : (
                    groupedDeadlines.map(group => (
                      <div key={group.label}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          {group.label}
                        </p>
                        {group.items.map(d => (
                          <button
                            key={d.id}
                            onClick={() => navigate(`/app/expedientes/${d.matter_id}`)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              group.urgency === 'overdue' ? 'bg-red-500 animate-pulse'
                              : group.urgency === 'today' ? 'bg-amber-400'
                              : group.urgency === 'tomorrow' ? 'bg-yellow-300'
                              : 'bg-blue-300'
                            }`} />
                            <span className="text-sm text-slate-700 truncate flex-1">
                              {d.matter_title || d.matter_reference || d.title}
                            </span>
                            <span className={`text-xs shrink-0 font-medium ${
                              group.urgency === 'overdue' ? 'text-red-500'
                              : group.urgency === 'today' ? 'text-amber-600'
                              : 'text-slate-400'
                            }`}>
                              {group.urgency === 'overdue'
                                ? 'Vencido'
                              : group.urgency === 'today'
                                ? 'Hoy'
                              : `${daysDiff(d.deadline_date)}d`}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white rounded-[14px] p-5 shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff]">
                <h2 className="text-sm font-bold text-slate-800 mb-4">
                  Actividad reciente
                </h2>
                <div className="space-y-3">
                  {(data?.activities ?? []).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-2">
                        <Activity className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        Sin actividad reciente
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Las acciones del equipo aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    (data?.activities ?? []).slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-start gap-3 py-1">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">
                            {a.description || ACTIVITY_LABELS[a.activity_type] || 'Actividad registrada'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatRelativeTime(a.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Columna central — 4/12 */}
            <div className="lg:col-span-4 space-y-4">

              {/* Portfolio Health */}
              <div className="bg-white rounded-[14px] p-5 shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff]">
                <h2 className="text-sm font-bold text-slate-800 mb-4">
                  Salud del portfolio
                </h2>
                <div className="text-center py-3">
                  <p className={`text-5xl font-bold tabular-nums ${
                    healthScore >= 75 ? 'text-emerald-600'
                    : healthScore >= 50 ? 'text-amber-600'
                    : 'text-red-600'
                  }`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {healthScore}
                  </p>
                  <p className={`text-sm font-medium mt-1 ${
                    healthScore >= 75 ? 'text-emerald-600'
                    : healthScore >= 50 ? 'text-amber-600'
                    : 'text-red-600'
                  }`}>
                    {healthScore >= 75 ? 'Buen estado'
                     : healthScore >= 50 ? 'Atención requerida'
                     : 'Estado crítico'}
                  </p>
                </div>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      healthScore >= 75 ? 'bg-emerald-500'
                      : healthScore >= 50 ? 'bg-amber-500'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Vencidos</p>
                    <p className="text-lg font-bold text-red-500 tabular-nums">
                      {deadlineBreakdown.overdue}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Esta semana</p>
                    <p className="text-lg font-bold text-amber-500 tabular-nums">
                      {deadlineBreakdown.week}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Al día</p>
                    <p className="text-lg font-bold text-emerald-500 tabular-nums">
                      {deadlineBreakdown.ok}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top deals del pipeline */}
              {(data?.deals ?? []).length > 0 && (
                <div className="bg-white rounded-[14px] p-5 shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-800">
                      Pipeline activo
                    </h2>
                    <button
                      onClick={() => navigate('/app/crm/kanban')}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Ver →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(data?.deals ?? []).slice(0, 3).map(deal => (
                      <div key={deal.id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-700 truncate flex-1 mr-2">
                          {deal.account_name_cache || deal.name}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums shrink-0">
                          {deal.amount_eur ? formatCurrency(deal.amount_eur) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Columna derecha — 3/12 */}
            <div className="lg:col-span-3 space-y-4">

              {/* IP-GENIUS Briefing */}
              <div className="bg-white rounded-[14px] p-5 shadow-[4px_4px_10px_#cdd1dc,-4px_-4px_10px_#ffffff]">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-800">
                      IP-GENIUS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Briefing para{' '}
                    {currentOrganization?.name || 'tu despacho'}
                  </p>
                </div>
                <div className="space-y-2">
                  {data?.briefing ? (
                    <>
                      {((data.briefing.content_json?.items) || [])
                        .slice(0, 3)
                        .map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <p className="text-sm text-slate-600 leading-snug">
                            {item.summary || item.title || item.description || ''}
                          </p>
                        </div>
                      ))}
                      <button
                        onClick={() => navigate('/app/briefing')}
                        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                      >
                        Ver análisis completo
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 rounded-full bg-amber-50 mx-auto flex items-center justify-center mb-2">
                        <Sparkles className="h-5 w-5 text-amber-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        Sin briefing hoy
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Se genera cada mañana automáticamente.
                      </p>
                      <button
                        onClick={() => navigate('/app/briefing')}
                        className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Generar ahora →
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Modo Focus activo */}
        {focusMode && !isLoading && (
          <p className="text-center text-sm text-slate-500 py-8">
            Modo Focus activo — mostrando solo lo urgente
          </p>
        )}

      </div>
    </div>
  )
