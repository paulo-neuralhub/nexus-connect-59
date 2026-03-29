import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '@/contexts/organization-context'
import { supabase } from '@/integrations/supabase/client'

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
    <div className="space-y-6 p-4">

      {/* Pasar estas props a los widgets en DASH-02: */}
      {/* portfolioCount, deadlines, watchCount, alertCount */}
      {/* pipelineValue, dealCount, healthScore */}
      {/* groupedDeadlines, criticalDeadlines */}
      {/* weekDeadlineCount, deadlineBreakdown */}
      {/* data.briefing, data.activities */}
      {/* isLoading, focusMode, setFocusMode */}
      {/* navigate, formatCurrency, formatRelativeTime, daysDiff */}

      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Dashboard cargando datos...</p>
        {!isLoading && data && (
          <p className="text-sm mt-2">
            ✓ {data.portfolioCount} expedientes ·{' '}
            {formatCurrency(pipelineValue)} pipeline ·{' '}
            Score {healthScore}/100
          </p>
        )}
      </div>

    </div>
  )
}
