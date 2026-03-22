import React, { useEffect, useRef, useState, useCallback } from 'react'

interface CoPilotAvatarProps {
  copilotMode: 'basic' | 'pro'
  isChatOpen: boolean
  showGreeting: boolean
  greetingMessage?: string
  urgentCount?: number
  bubbleState?: 'standby' | 'attentive' | 'urgent' | 'guide'
  onAvatarClick: () => void
  onGreetingView: () => void
  onGreetingLater: () => void
}

export function CoPilotAvatar({
  copilotMode,
  isChatOpen,
  showGreeting,
  greetingMessage,
  urgentCount = 0,
  bubbleState = 'standby',
  onAvatarClick,
  onGreetingView,
  onGreetingLater,
}: CoPilotAvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null)
  const hasLanded = useRef(false)

  const savedPos = (() => {
    try {
      const p = localStorage.getItem('copilot_position')
      return p ? JSON.parse(p) : null
    } catch { return null }
  })()

  const [pos, setPos] = useState({
    right: savedPos?.right ?? 24,
    bottom: savedPos?.bottom ?? 24,
  })

  const dragging = useRef(false)
  const didDrag = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 })

  // Landing animation — solo una vez al montar
  useEffect(() => {
    if (hasLanded.current || !avatarRef.current) return
    hasLanded.current = true
    const el = avatarRef.current
    el.style.animation = 'none'
    void el.offsetWidth
    el.style.animation = 'copilotLand 1.4s cubic-bezier(0.22,1,0.36,1) forwards'
    const cleanup = () => {
      if (el) {
        el.style.animation = ''
        el.style.opacity = '1'
        el.style.transform = 'none'
      }
    }
    el.addEventListener('animationend', cleanup, { once: true })
  }, [])

  // Mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    didDrag.current = false
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      right: pos.right, bottom: pos.bottom,
    }
  }, [pos])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = dragStart.current.x - e.clientX
      const dy = dragStart.current.y - e.clientY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDrag.current = true
      }
      setPos({
        right: Math.max(8, Math.min(window.innerWidth - 72, dragStart.current.right + dx)),
        bottom: Math.max(8, Math.min(window.innerHeight - 72, dragStart.current.bottom + dy)),
      })
    }
    const handleMouseUp = () => {
      if (!dragging.current) return
      const wasDrag = didDrag.current
      dragging.current = false
      if (wasDrag) {
        setPos(p => {
          localStorage.setItem('copilot_position', JSON.stringify(p))
          return p
        })
        // Reset didDrag after a tick so the click event (which fires after mouseup) still sees it
        setTimeout(() => { didDrag.current = false }, 0)
      } else {
        didDrag.current = false
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Touch drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const t = e.touches[0]
    dragging.current = true
    dragStart.current = {
      x: t.clientX, y: t.clientY,
      right: pos.right, bottom: pos.bottom,
    }
  }, [pos])

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      const t = e.touches[0]
      const dx = dragStart.current.x - t.clientX
      const dy = dragStart.current.y - t.clientY
      setPos({
        right: Math.max(8, Math.min(window.innerWidth - 72, dragStart.current.right + dx)),
        bottom: Math.max(8, Math.min(window.innerHeight - 72, dragStart.current.bottom + dy)),
      })
    }
    const handleTouchEnd = () => {
      dragging.current = false
      setPos(p => {
        localStorage.setItem('copilot_position', JSON.stringify(p))
        return p
      })
    }
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Colores según modo
  const isBasic = copilotMode === 'basic'
  const accentColor = isBasic ? '#1E293B' : '#F59E0B'
  const accentColorRgb = isBasic ? '30,41,59' : '245,158,11'
  const avatarSrc = isBasic
    ? '/assets/copilot-nexus-avatar.jpeg'
    : '/assets/copilot-genius-avatar.jpeg'
  const avatarAlt = isBasic ? 'Nexus' : 'Genius'
  const avatarInitial = isBasic ? 'N' : 'G'
  const avatarBg = isBasic ? '#E2E8F0' : '#FEF3C7'
  const avatarInitialColor = isBasic ? '#1E293B' : '#D97706'

  const getAvatarAnimation = () => {
    if (isChatOpen) return 'none'
    if (bubbleState === 'urgent')
      return 'copilotBreathUrgent 1.5s ease-in-out infinite'
    if (bubbleState === 'attentive') return 'none'
    return 'copilotBreath 3.5s ease-in-out infinite'
  }

  const getBorder = () =>
    bubbleState === 'urgent'
      ? '2.5px solid #EF4444'
      : `2.5px solid ${accentColor}`

  const getBoxShadow = () => {
    if (bubbleState === 'urgent') return '0 4px 20px rgba(239,68,68,0.45)'
    if (bubbleState === 'attentive')
      return `0 4px 20px rgba(${accentColorRgb},0.45)`
    return `0 4px 14px rgba(${accentColorRgb},0.30)`
  }

  const containerOpacity =
    bubbleState === 'guide' && !isChatOpen
      ? { opacity: 0.2, filter: 'grayscale(0.3)', transition: 'opacity 0.5s ease' }
      : { opacity: 1, transition: 'opacity 0.5s ease' }

  return (
    <div
      style={{
        position: 'fixed',
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        cursor: dragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...containerOpacity,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* GREETING TOOLTIP */}
      {showGreeting && !isChatOpen && (
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
            padding: '14px 16px',
            maxWidth: 260,
            animation: 'copilotStepIn 0.4s ease-out',
            border: `1px solid rgba(${accentColorRgb},0.15)`,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: '#374151',
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            {greetingMessage || `Hola 👋 ¿En qué puedo ayudarte hoy?`}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={e => {
                e.stopPropagation()
                onGreetingView()
              }}
              style={{
                background: accentColor,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              Ver →
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                onGreetingLater()
              }}
              style={{
                background: 'transparent',
                color: '#9CA3AF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

      {/* PULSE RINGS + AVATAR */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {(showGreeting || bubbleState === 'attentive') && !isChatOpen && (
          <>
            <div className={isBasic ? 'copilot-ring-basic' : 'copilot-ring-pro'} />
            <div className={isBasic ? 'copilot-ring-basic' : 'copilot-ring-pro'} />
            <div className={isBasic ? 'copilot-ring-basic' : 'copilot-ring-pro'} />
          </>
        )}

        {/* Badge urgentes */}
        {urgentCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -2, right: -2,
              background: '#EF4444',
              color: 'white',
              borderRadius: '50%',
              width: 20, height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              border: '2px solid white',
              zIndex: 2,
            }}
          >
            {urgentCount > 9 ? '9+' : urgentCount}
          </div>
        )}

        {/* EL AVATAR */}
        <div
          ref={avatarRef}
          onClick={e => {
            e.stopPropagation()
            console.log('[TEST] Avatar clicked, didDrag:', didDrag.current)
            if (didDrag.current) return
            onAvatarClick()
          }}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            overflow: 'hidden',
            border: getBorder(),
            boxShadow: getBoxShadow(),
            cursor: 'pointer',
            animation: getAvatarAnimation(),
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            background: avatarBg,
          }}
          onMouseEnter={e => {
            if (!dragging.current) {
              e.currentTarget.style.transform = 'scale(1.07)'
              e.currentTarget.style.boxShadow = `0 6px 24px rgba(${accentColorRgb},0.45)`
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = getBoxShadow()
          }}
        >
          <img
            src={avatarSrc}
            alt={avatarAlt}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              const parent = e.currentTarget.parentElement
              if (parent) {
                e.currentTarget.style.display = 'none'
                const fb = document.createElement('div')
                fb.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${avatarBg};color:${avatarInitialColor};font-weight:700;font-size:22px;font-family:Inter,sans-serif;`
                fb.textContent = avatarInitial
                parent.appendChild(fb)
              }
            }}
          />
        </div>
      </div>

      {/* Label PRO */}
      {!isBasic && !showGreeting && !isChatOpen && bubbleState === 'standby' && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: accentColor,
            textAlign: 'center',
            letterSpacing: '0.05em',
            marginTop: -2,
            opacity: 0.7,
          }}
        >
          PRO ✦
        </div>
      )}
    </div>
  )
}
