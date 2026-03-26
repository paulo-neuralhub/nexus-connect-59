import { useState, useEffect } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import { RefreshCw, Clock } from 'lucide-react';

interface HeroBriefingProps {
  content: any;
  briefing: any;
  onRefresh: () => void;
}

export function HeroBriefing({ content, briefing, onRefresh }: HeroBriefingProps) {
  const animatedScore = useCountUp(content.health_score || 0, 1200);

  const scoreColor =
    animatedScore >= 80 ? '#22C55E' : animatedScore >= 60 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 40;
  const strokeOffset = circumference * (1 - (content.health_score || 0) / 100);

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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)',
        borderRadius: 20,
        padding: '36px 40px',
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
          gap: 40,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* LEFT */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {content.has_ip_genius ? '🌅 Morning Briefing' : '📊 Daily Report'}
          </h1>

          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              margin: '6px 0 0',
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
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
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

        {/* CENTER — 3 PILLS */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* PILL FATAL */}
          <div
            style={{
              background:
                fatalCount > 0
                  ? 'rgba(127,29,29,0.4)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                fatalCount > 0
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(255,255,255,0.1)'
              }`,
              borderRadius: 10,
              padding: '12px 18px',
              minWidth: 130,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            {fatalCount > 0 ? (
              <>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#EF4444' }}>
                  {fatalCount}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#EF4444',
                  }}
                >
                  FATAL
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
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
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10,
              padding: '12px 18px',
              minWidth: 130,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#F59E0B' }}>
              {criticalCount}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#F59E0B',
              }}
            >
              URGENTES
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              menos de 7 días
            </span>
          </div>

          {/* PILL HOY */}
          <div
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 10,
              padding: '12px 18px',
              minWidth: 130,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#3B82F6' }}>
              {agendaCount}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#3B82F6',
              }}
            >
              HOY
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              eventos en agenda
            </span>
          </div>
        </div>

        {/* RIGHT — HEALTH SCORE */}
        {content.has_ip_genius && content.health_score !== null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg width={100} height={100} viewBox="0 0 100 100">
                <circle
                  cx={50}
                  cy={50}
                  r={40}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={8}
                />
                <circle
                  cx={50}
                  cy={50}
                  r={40}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.5s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: scoreColor,
                    transition: 'color 0.5s ease',
                  }}
                >
                  {animatedScore}
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Portfolio Health Score
            </p>
            {content.health_dimensions?.penalties?.length > 0 && (
              <p
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 4,
                  maxWidth: 140,
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
            <p style={{ fontSize: 16, fontWeight: 700 }}>✨ IP-GENIUS</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Activa el análisis inteligente
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
