import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '@/contexts/organization-context'
import { supabase } from '@/integrations/supabase/client'
import {
  FolderOpen, Clock, TrendingUp, Radar, Activity,
  Sparkles, CheckCircle, ChevronRight, AlertTriangle, Bell
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
    <div className="min-h-screen bg-[#F1F4F9]">
      <div className="max-w-[1400px] mx-auto p-6 space-y-5">

        {/* ── HEADER ─────────────────────────────────── */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight">
              {getGreeting()},{' '}
              <span className="text-slate-500 font-normal">
                {currentOrganization?.name}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
              {weekDeadlineCount > 0 && (
                <span className="ml-2 text-amber-500 font-medium">
                  · {weekDeadlineCount} plazos esta semana
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(data?.alertCount ?? 0) > 0 && (
              <button
                onClick={() => navigate('/app/spider')}
                className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-3 py-1.5 hover:bg-violet-100 transition-colors font-medium"
              >
                <Bell className="w-3 h-3" />
                {data?.alertCount} alertas
              </button>
            )}
            <button
              title="Modo Focus: solo lo urgente"
              onClick={() => setFocusMode(!focusMode)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                focusMode
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {focusMode ? '◉ Focus ON' : '◎ Focus'}
            </button>
          </div>
        </div>

        {/* ── BANNER CRÍTICO ───────────────────────────── */}
        {criticalDeadlines.length > 0 && (
          <div className="flex items-center gap-3 bg-red-600 text-white rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
              <span className="text-sm font-semibold">
                {criticalDeadlines.length} plazos vencidos
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              {criticalDeadlines.slice(0, 3).map(d => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/app/expedientes/${d.matter_id}`)}
                  className="shrink-0 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-2.5 py-0.5 text-xs font-medium truncate max-w-[120px]"
                >
                  {d.matter_title || d.matter_reference || d.title}
                </button>
              ))}
              {criticalDeadlines.length > 3 && (
                <span className="text-white/70 text-xs shrink-0">
                  +{criticalDeadlines.length - 3} más
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/app/deadlines')}
              className="shrink-0 bg-white text-red-600 rounded-full px-3 py-1 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              Ver todos →
            </button>
          </div>
        )}

        {/* ── 4 KPIs PRINCIPALES ───────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[100px] bg-white rounded-2xl animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 — Expedientes */}
            <button
              onClick={() => navigate('/app/expedientes')}
              className="bg-white rounded-2xl p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-all duration-200"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Portfolio</p>
              <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">
                <AnimatedNumber value={data?.portfolioCount ?? 0} />
              </p>
              <p className="text-xs text-slate-400 mt-2">expedientes activos</p>
            </button>

            {/* KPI 2 — En riesgo */}
            <button
              onClick={() => navigate('/app/deadlines')}
              className="bg-white rounded-2xl p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-all duration-200"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">En riesgo</p>
              <p className="text-[40px] font-bold leading-none tracking-tight text-red-500">
                <AnimatedNumber value={deadlineBreakdown.overdue + deadlineBreakdown.week} />
              </p>
              <p className="text-xs text-slate-400 mt-2">próximos 7 días</p>
            </button>

            {/* KPI 3 — Pipeline */}
            <button
              onClick={() => navigate('/app/crm/kanban')}
              className="bg-white rounded-2xl p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-all duration-200"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Pipeline</p>
              <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">
                {formatCurrency(pipelineValue)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {dealCount} deal{dealCount !== 1 ? 's' : ''} en curso
              </p>
            </button>

            {/* KPI 4 — Vigilancias */}
            <button
              onClick={() => navigate('/app/spider')}
              className="bg-white rounded-2xl p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-all duration-200"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Vigilancias</p>
              <div className="flex items-end gap-2">
                <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">
                  <AnimatedNumber value={data?.watchCount ?? 0} />
                </p>
                {(data?.alertCount ?? 0) > 0 && (
                  <span className="mb-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                    {data?.alertCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">marcas monitorizadas</p>
            </button>
          </div>
        )}

        {/* ── CONTENIDO PRINCIPAL ──────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5">
              <div className="h-96 bg-white rounded-2xl animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-96 bg-white rounded-2xl animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]" />
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-white rounded-2xl animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]" />
            </div>
          </div>
        ) : !focusMode && (
          <>
            {/* FILA PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* Plazos — 5/12 */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold text-slate-800">Plazos próximos</h2>
                    <button
                      onClick={() => navigate('/app/deadlines')}
                      className="text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
                    >
                      Ver todos →
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[380px]">
                  {groupedDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="w-10 h-10 text-emerald-200 mb-3" />
                      <p className="text-sm font-medium text-slate-500">Portfolio al día</p>
                      <p className="text-xs text-slate-400 mt-1">Sin plazos urgentes</p>
                    </div>
                  ) : (
                    groupedDeadlines.map(group => (
                      <div key={group.label}>
                        <div className="px-6 py-2 bg-slate-50/80 flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            group.urgency === 'overdue'
                              ? 'text-red-500'
                              : group.urgency === 'today'
                                ? 'text-red-400'
                                : group.urgency === 'week' || group.urgency === 'tomorrow'
                                  ? 'text-amber-500'
                                  : 'text-slate-400'
                          }`}>
                            {group.label}
                          </span>
                          <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                            group.urgency === 'overdue'
                              ? 'bg-red-100 text-red-500'
                              : group.urgency === 'today'
                                ? 'bg-red-50 text-red-400'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {group.items.length}
                          </span>
                        </div>
                        {group.items.slice(0, 4).map(d => (
                          <button
                            key={d.id}
                            onClick={() => navigate(`/app/expedientes/${d.matter_id}`)}
                            className="w-full flex items-center gap-4 px-6 py-3 hover:bg-slate-50/80 transition-colors text-left group border-b border-slate-50 last:border-0"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              group.urgency === 'overdue'
                                ? 'bg-red-400'
                                : group.urgency === 'today'
                                  ? 'bg-red-300 animate-pulse'
                                  : group.urgency === 'week' || group.urgency === 'tomorrow'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300'
                            }`} />
                            <span className="flex-1 text-[13px] text-slate-700 truncate group-hover:text-blue-600 transition-colors font-medium">
                              {d.matter_title || d.matter_reference || d.title}
                            </span>
                            <span className={`text-[11px] font-semibold shrink-0 tabular-nums ${
                              group.urgency === 'overdue'
                                ? 'text-red-400'
                                : group.urgency === 'today'
                                  ? 'text-red-300'
                                  : 'text-amber-400'
                            }`}>
                              {group.urgency === 'overdue'
                                ? 'Vencido'
                                : group.urgency === 'today'
                                  ? 'Hoy'
                                  : `${daysDiff(d.deadline_date)}d`}
                            </span>
                          </button>
                        ))}
                        {group.items.length > 4 && (
                          <button
                            onClick={() => navigate('/app/deadlines')}
                            className="w-full text-center text-[11px] text-slate-400 hover:text-blue-500 py-2.5 transition-colors border-b border-slate-50"
                          >
                            + {group.items.length - 4} más
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* IP-GENIUS — 4/12 */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-6 py-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white tracking-tight">IP-GENIUS</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 rounded-full px-2 py-0.5 font-semibold border border-amber-400/30">
                        Briefing
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40">
                      {new Date().toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </p>
                  </div>
                  <div className="flex-1 px-6 py-5">
                    {data?.briefing ? (
                      <div className="space-y-4">
                        {((data.briefing.content_json?.items) || [])
                          .filter((item: any) =>
                            item.type !== 'finance' &&
                            item.type !== 'invoice' &&
                            item.category !== 'finance'
                          )
                          .slice(0, 4)
                          .map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                item.priority === 'critical'
                                  ? 'bg-red-500'
                                  : item.priority === 'high'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300'
                              }`} />
                              <p className="text-[13px] text-slate-600 leading-relaxed">
                                {item.summary || item.title || item.description || ''}
                              </p>
                            </div>
                          ))}
                        <button
                          onClick={() => navigate('/app/briefing')}
                          className="w-full mt-2 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[12px] font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          Ver análisis completo
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                          <Sparkles className="w-6 h-6 text-amber-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 text-center">Sin briefing hoy</p>
                        <p className="text-xs text-slate-400 mt-1 text-center">Se genera automáticamente cada mañana</p>
                        <button
                          onClick={() => navigate('/app/briefing')}
                          className="mt-4 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
                        >
                          Generar ahora →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Health — 3/12 */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                {/* Health Score */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Salud portfolio</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="#f1f4f9" strokeWidth="6" />
                        <circle
                          cx="30" cy="30" r="24" fill="none"
                          stroke={healthScore >= 75 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${(healthScore / 100) * 150.8} 150.8`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[15px] font-bold ${
                          healthScore >= 75
                            ? 'text-emerald-600'
                            : healthScore >= 50
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}>
                          {healthScore}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${
                        healthScore >= 75
                          ? 'text-emerald-600'
                          : healthScore >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}>
                        {healthScore >= 75 ? 'Buen estado' : healthScore >= 50 ? 'Atención' : 'Crítico'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">de 100 puntos</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">Vencidos</span>
                      <span className="font-bold text-red-500">{deadlineBreakdown.overdue}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">Esta semana</span>
                      <span className="font-bold text-amber-500">{deadlineBreakdown.week}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">Al día</span>
                      <span className="font-bold text-emerald-500">{deadlineBreakdown.ok}</span>
                    </div>
                  </div>
                </div>

                {/* Top deals */}
                {(data?.deals ?? []).length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Top deals</p>
                      <button
                        onClick={() => navigate('/app/crm/kanban')}
                        className="text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
                      >
                        Ver →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(data?.deals ?? []).slice(0, 3).map(deal => (
                        <div key={deal.id} className="flex items-center justify-between gap-2">
                          <span className="text-[12px] text-slate-600 truncate flex-1 font-medium">
                            {deal.account_name_cache || deal.name}
                          </span>
                          <span className="text-[12px] font-bold text-emerald-600 shrink-0 tabular-nums">
                            {deal.amount_eur ? formatCurrency(deal.amount_eur) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* FILA INFERIOR — Actividad */}
            {(data?.activities ?? []).length > 0 && (
              <div className="bg-white rounded-2xl px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Actividad reciente</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {(data?.activities ?? []).slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed">
                          {a.description || ACTIVITY_LABELS[a.activity_type] || 'Actividad registrada'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatRelativeTime(a.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {focusMode && !isLoading && (
          <p className="text-xs text-center text-slate-400 py-6">
            Modo Focus — mostrando solo lo urgente
          </p>
        )}

      </div>
    </div>
  )
}
