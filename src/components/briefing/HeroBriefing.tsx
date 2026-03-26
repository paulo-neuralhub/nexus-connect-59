import { useState, useEffect } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import { RefreshCw, Clock } from 'lucide-react';

interface HeroBriefingProps {
  content: any;
  briefing: any;
  onRefresh: () => void;
}

export function HeroBriefing({ content, briefing, onRefresh }: HeroBriefingProps) {
  const score = content.health_score || 0;
  const animatedScore = useCountUp(score, 1200);

  const scoreColor =
    score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 58;
  const strokeOffset = circumference * (1 - score / 100);

  const minutesAgo = Math.round(
    (Date.now() - new Date(briefing.created_at).getTime()) / 60000
  );

  const fatalCount = content.sections?.urgent?.fatal?.length || 0;
  const criticalCount =
    (content.sections?.urgent?.critical?.length || 0) +
    (content.sections?.urgent?.urgent?.length || 0);
  const agendaCount = content.sections?.agenda?.length || 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        padding: '40px 48px',
        minHeight: 240,
        borderRadius: 0,
        width: '100%',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle glow */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 48,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ZONE 1 — LEFT TEXT */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: 'white',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {content.has_ip_genius ? '🌅 Morning Briefing' : '📊 Daily Report'}
          </h1>

          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · {content.user_name}
          </p>

          {content.whats_new?.new_messages > 0 && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 10,
                fontSize: 12,
                color: '#facc15',
                fontWeight: 600,
              }}
            >
              ✨ {content.whats_new.new_messages} novedades desde ayer
            </span>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <Clock size={12} />
            <span>Actualizado hace {minutesAgo} min</span>
            <button
              onClick={onRefresh}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw size={10} /> Actualizar
            </button>
          </div>
        </div>

        {/* ZONE 2 — 3 PILLS */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
          {/* PILL FATAL */}
          <div
            style={{
              background:
                fatalCount > 0
                  ? 'rgba(127,29,29,0.5)'
                  : 'rgba(255,255,255,0.06)',
              border: `1px solid ${
                fatalCount > 0
                  ? 'rgba(239,68,68,0.6)'
                  : 'rgba(255,255,255,0.12)'
              }`,
              borderRadius: 14,
              padding: '20px 24px',
              minWidth: 140,
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            {fatalCount > 0 ? (
              <>
                <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#FCA5A5' }}>
                  {fatalCount}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginTop: 8, color: '#FCA5A5' }}>
                  FATAL
                </span>
                <span style={{ fontSize: 10, opacity: 0.6, marginTop: 3, color: 'rgba(255,255,255,0.6)' }}>
                  sin posibilidad de prórroga
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                ✓ Sin fatales
              </span>
            )}
          </div>

          {/* PILL URGENTES */}
          <div
            style={{
              background: 'rgba(124,45,18,0.5)',
              border: '1px solid rgba(249,115,22,0.6)',
              borderRadius: 14,
              padding: '20px 24px',
              minWidth: 140,
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#FED7AA' }}>
              {criticalCount}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginTop: 8, color: '#FED7AA' }}>
              URGENTES
            </span>
            <span style={{ fontSize: 10, opacity: 0.6, marginTop: 3, color: 'rgba(255,255,255,0.6)' }}>
              menos de 7 días
            </span>
          </div>

          {/* PILL HOY */}
          <div
            style={{
              background: 'rgba(30,64,175,0.5)',
              border: '1px solid rgba(59,130,246,0.6)',
              borderRadius: 14,
              padding: '20px 24px',
              minWidth: 140,
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#93C5FD' }}>
              {agendaCount}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginTop: 8, color: '#93C5FD' }}>
              HOY
            </span>
            <span style={{ fontSize: 10, opacity: 0.6, marginTop: 3, color: 'rgba(255,255,255,0.6)' }}>
              eventos en agenda
            </span>
          </div>
        </div>

        {/* ZONE 3 — HEALTH SCORE */}
        {content.has_ip_genius && content.health_score !== null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                <circle
                  cx={70}
                  cy={70}
                  r={58}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={10}
                />
                <circle
                  cx={70}
                  cy={70}
                  r={58}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dashoffset 800ms ease-in-out' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>
                  {animatedScore}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  /100
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 8,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Portfolio Health Score
            </p>
            {content.health_dimensions?.penalties?.length > 0 && (
              <p
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: 4,
                  maxWidth: 140,
                  textAlign: 'center',
                }}
              >
                {content.health_dimensions.penalties[0]}
              </p>
            )}
          </div>
        ) : !content.has_ip_genius ? (
          <div
            style={{
              textAlign: 'center',
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>✨ IP-GENIUS</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 0 }}>
              Activa el análisis inteligente
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
