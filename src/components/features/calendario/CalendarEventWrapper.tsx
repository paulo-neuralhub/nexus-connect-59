// ============================================
// Custom event component for react-big-calendar
// Multi-line card + hover tooltip
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createPortal } from 'react-dom';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  deadline_fatal: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', label: 'Plazo FATAL' },
  deadline: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', label: 'Plazo' },
  meeting: { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6', label: 'Reunión' },
  task: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B', label: 'Tarea' },
  reminder: { bg: '#F1F5F9', text: '#475569', border: '#94A3B8', label: 'Recordatorio' },
  call: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B', label: 'Llamada' },
  renewal: { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6', label: 'Renovación' },
  appointment: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6', label: 'Cita' },
};

interface EventTooltipProps {
  event: CalendarEvent;
  anchorRect: DOMRect;
}

function EventTooltip({ event, anchorRect }: EventTooltipProps) {
  const style = TYPE_STYLES[event.type] || TYPE_STYLES.task;

  // Position: try above, fallback below
  const tooltipWidth = 260;
  const tooltipHeightEstimate = 160;
  const gap = 8;

  let top = anchorRect.top - tooltipHeightEstimate - gap;
  if (top < 8) top = anchorRect.bottom + gap;

  let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
  if (left < 8) left = 8;
  if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top,
        left,
        width: tooltipWidth,
        background: '#1E293B',
        color: 'white',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
        zIndex: 9999,
        pointerEvents: 'none',
        lineHeight: 1.5,
      }}
    >
      {/* Row: badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: style.border + '30',
            color: style.border,
            padding: '2px 8px',
            borderRadius: 99,
          }}
        >
          {style.label}
        </span>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>
          {format(event.start, "EEE d MMM · HH:mm", { locale: es })}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
        {event.title}
      </div>

      {/* Matter */}
      {event.matter && (
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
          📋 {event.matter.reference} · {event.matter.title}
        </div>
      )}

      {/* Account */}
      {event.account && (
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
          👤 {event.account.name}
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div
          style={{
            fontSize: 11,
            color: '#CBD5E1',
            fontStyle: 'italic',
            marginTop: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function CalendarEventComponent({ event }: { event: CalendarEvent }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (ref.current) {
        setRect(ref.current.getBoundingClientRect());
        setShowTooltip(true);
      }
    }, 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const style = TYPE_STYLES[event.type] || TYPE_STYLES.task;

  // Build subtitle: account + matter
  const parts: string[] = [];
  if (event.account) parts.push(event.account.name);
  if (event.matter) parts.push(`📋 ${event.matter.reference}`);
  const subtitle = parts.join(' · ');

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: '2px 6px',
        lineHeight: 1.3,
        overflow: 'hidden',
        minHeight: 22,
      }}
    >
      {/* Line 1: title */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: style.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {!event.allDay && (
          <span style={{ fontWeight: 500, marginRight: 4, opacity: 0.8 }}>
            {format(event.start, 'HH:mm')}
          </span>
        )}
        {event.title}
      </div>

      {/* Line 2: context (only in month view where there's space) */}
      {subtitle && (
        <div
          style={{
            fontSize: 10,
            color: style.text,
            opacity: 0.65,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      )}

      {showTooltip && rect && <EventTooltip event={event} anchorRect={rect} />}
    </div>
  );
}
