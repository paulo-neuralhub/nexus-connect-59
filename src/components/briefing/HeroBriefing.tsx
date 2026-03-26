import { useCountUp } from '@/hooks/use-count-up';

interface HeroBriefingProps {
  content: any;
  briefing: any;
  onRefresh: () => void;
}

export function HeroBriefing({ content, briefing, onRefresh }: HeroBriefingProps) {
  const score = content.health_score || 0;
  const animatedScore = useCountUp(score, 1200);
  const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 68;
  const strokeOffset = circumference * (1 - score / 100);

  const fatalCount = content.sections?.urgent?.fatal?.length || 0;
  const criticalCount =
    (content.sections?.urgent?.critical?.length || 0) +
    (content.sections?.urgent?.urgent?.length || 0);
  const agendaCount = content.sections?.agenda?.length || 0;

  const fatalItems = content.sections?.urgent?.fatal || [];
  const criticalItems = content.sections?.urgent?.critical || [];
  const agendaItems = content.sections?.agenda || [];
  const inbox = content.sections?.inbox || { total: 0, queries: 0, admin: 0, urgent: 0, instructions: 0, by_channel: {} };
  const portfolio = content.sections?.portfolio || { total: 0, by_status: {}, by_type: {} };

  const borderLeftColor = fatalCount > 0 ? '#7F1D1D'
    : criticalItems.length > 0 ? '#EF4444'
    : '#F59E0B';

  const circumference48 = 2 * Math.PI * 20;
  const strokeOffset48 = circumference48 * (1 - score / 100);
  const scoreLargeColor = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';

  return (
    <>
      {/* ═══════ SECTION 1 — HEADER IP-NEXUS STYLE ═══════ */}
      <div style={{ padding: '32px 32px 0' }}>

        {/* Breadcrumb IA */}
        {content.has_ip_genius && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#FEF3C7', border: '1px solid #FDE68A',
            borderRadius: 999, padding: '4px 12px',
            fontSize: 11, fontWeight: 600, color: '#B45309', marginBottom: 16
          }}>
            ✨ IP-GENIUS · Morning Briefing
          </div>
        )}

        {/* Título de página */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: 24
        }}>
          <div>
            <h1 style={{
              fontSize: 36, fontWeight: 800, color: '#0F172A', margin: 0,
              letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Buenos días, {content.user_name} 👋
            </h1>
            <p style={{
              fontSize: 14, color: '#64748B', marginTop: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <button onClick={onRefresh} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #E2E8F0',
            borderRadius: 8, padding: '8px 16px',
            fontSize: 13, color: '#64748B', cursor: 'pointer', fontWeight: 500
          }}>
            ↻ Actualizar
          </button>
        </div>

        {/* 3+1 KPI PILLS */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {/* PILL FATAL */}
          <div style={{
            flex: 1,
            background: fatalCount > 0 ? '#FEF2F2' : 'white',
            border: `2px solid ${fatalCount > 0 ? '#FCA5A5' : '#E2E8F0'}`,
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: fatalCount > 0 ? '#FEE2E2' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0
            }}>⛔</div>
            <div>
              <div style={{
                fontSize: 40, fontWeight: 800,
                color: fatalCount > 0 ? '#DC2626' : '#CBD5E1',
                lineHeight: 1, letterSpacing: '-0.03em',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>{fatalCount}</div>
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: fatalCount > 0 ? '#EF4444' : '#94A3B8', marginTop: 2
              }}>
                {fatalCount > 0 ? 'FATALES — acción YA' : 'Sin plazos fatales'}
              </div>
            </div>
          </div>

          {/* PILL URGENTES */}
          <div style={{
            flex: 1,
            background: criticalCount > 0 ? '#FFF7ED' : 'white',
            border: `2px solid ${criticalCount > 0 ? '#FED7AA' : '#E2E8F0'}`,
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0
            }}>⚠️</div>
            <div>
              <div style={{
                fontSize: 40, fontWeight: 800, color: '#EA580C',
                lineHeight: 1, letterSpacing: '-0.03em',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>{criticalCount}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F97316', marginTop: 2 }}>
                URGENTES — menos de 7 días
              </div>
            </div>
          </div>

          {/* PILL HOY */}
          <div style={{
            flex: 1, background: '#EFF6FF', border: '2px solid #BFDBFE',
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#DBEAFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0
            }}>📅</div>
            <div>
              <div style={{
                fontSize: 40, fontWeight: 800, color: '#2563EB',
                lineHeight: 1, letterSpacing: '-0.03em',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>{agendaCount}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', marginTop: 2 }}>
                EVENTOS HOY
              </div>
            </div>
          </div>

          {/* HEALTH SCORE */}
          {content.has_ip_genius && (
            <div style={{
              flex: 1, background: 'white', border: '2px solid #E2E8F0',
              borderRadius: 14, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                  <circle cx="24" cy="24" r="20" fill="none"
                    stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference48} strokeDashoffset={strokeOffset48}
                    transform="rotate(-90 24 24)"
                    style={{ transition: 'stroke-dashoffset 800ms ease' }} />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>
                    {animatedScore}
                  </span>
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 40, fontWeight: 800, color: scoreLargeColor,
                  lineHeight: 1, letterSpacing: '-0.03em',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>{animatedScore}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
                  Portfolio Health Score
                </div>
                {content.health_dimensions?.penalties?.[0] && (
                  <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>
                    ↓ {content.health_dimensions.penalties[0]}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ SECTION 2 — 4 CARDS ═══════ */}
      <div style={{ padding: '0 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }}>

          {/* CARD 1 — ACCIÓN INMEDIATA */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', borderLeft: `5px solid ${borderLeftColor}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🚨 Acción Inmediata
              </div>
              <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                {fatalCount + criticalItems.length} críticos
              </div>
            </div>

            {fatalItems.map((item: any) => (
              <div key={item.item_id} style={{ padding: '14px 20px', borderBottom: '1px solid #FEF2F2', background: '#FFF5F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                    VENCIDO · {item.jurisdiction}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>{item.matter_ref}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.title}
                </div>
                <a href="/app/matters" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                  Ver expediente →
                </a>
              </div>
            ))}

            {criticalItems.map((item: any) => (
              <div key={item.item_id} style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                    {item.days_remaining}d · {item.jurisdiction}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>{item.matter_ref}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {(item.title || '').replace('⚠️ URGENTE: ', '')}
                </div>
                <a href="/app/matters" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                  Ver expediente →
                </a>
              </div>
            ))}
          </div>

          {/* CARD 2 — AGENDA HOY */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                📅 Agenda Hoy
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {agendaItems.length > 0 ? (
                agendaItems.map((event: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: i < agendaItems.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ width: 4, minHeight: 40, background: event.color || '#8B5CF6', borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>
                        {new Date(event.start_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(event.end_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {event.title}
                      </div>
                      {event.matter_ref && (
                        <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 500, marginTop: 2 }}>{event.matter_ref}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>
                  Sin eventos hoy
                </div>
              )}
            </div>
          </div>

          {/* CARD 3 — INBOX */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📬 Inbox</div>
              <div style={{ background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                {inbox.total} total
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Instrucciones', value: inbox.instructions, bg: '#F5F3FF', color: '#7C3AED' },
                { label: 'Urgentes', value: inbox.urgent, bg: '#FFF5F5', color: '#DC2626' },
                { label: 'Consultas', value: inbox.queries, bg: '#EFF6FF', color: '#2563EB' },
                { label: 'Admin', value: inbox.admin, bg: '#F8FAFC', color: '#64748B' }
              ].map(pill => (
                <div key={pill.label} style={{ background: pill.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: pill.color, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {pill.value}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: pill.color, marginTop: 6, opacity: 0.8 }}>
                    {pill.label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>📧 {inbox.by_channel?.email || 0} email</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>💬 {inbox.by_channel?.whatsapp || 0} WhatsApp</span>
              <a href="/app/communications" style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none', marginLeft: 'auto', fontWeight: 500 }}>
                Ver inbox →
              </a>
            </div>
          </div>

          {/* CARD 4 — PORTFOLIO */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📊 Portfolio</div>
              <div style={{ background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                {portfolio.total} expedientes
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {[
                { label: 'Registradas', key: 'registered', color: '#22C55E', value: portfolio.by_status?.registered || 0 },
                { label: 'En examen', key: 'examining', color: '#3B82F6', value: portfolio.by_status?.examining || 0 },
                { label: 'Office Action', key: 'office_action', color: '#EF4444', value: portfolio.by_status?.office_action || 0 },
                { label: 'Publicadas', key: 'published', color: '#F59E0B', value: portfolio.by_status?.published || 0 },
                { label: 'Pendientes', key: 'pending', color: '#94A3B8', value: portfolio.by_status?.pending || 0 }
              ].map(bar => (
                <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748B', width: 100, flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {bar.label}
                  </span>
                  <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: portfolio.total > 0 ? `${(bar.value / portfolio.total) * 100}%` : '0%',
                      background: bar.color, borderRadius: 4, transition: 'width 600ms ease-out'
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', width: 20, textAlign: 'right', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {bar.value}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                {[
                  { label: `TM: ${portfolio.by_type?.trademark || 0}`, color: '#EDE9FE', text: '#6D28D9' },
                  { label: `PAT: ${portfolio.by_type?.patent || 0}`, color: '#DBEAFE', text: '#1D4ED8' },
                  { label: `DES: ${portfolio.by_type?.design || 0}`, color: '#DCFCE7', text: '#15803D' }
                ].map(pill => (
                  <span key={pill.label} style={{ background: pill.color, color: pill.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
