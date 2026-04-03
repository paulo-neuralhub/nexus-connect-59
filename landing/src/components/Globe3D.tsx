import { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react'

const ReactGlobe = lazy(() => import('react-globe.gl'))

// Main IP offices with real coordinates
const mainOffices = [
  { lat: 40.41, lng: -3.70, name: 'OEPM', country: 'ES', size: 0.8, color: '#FCA311' },
  { lat: 48.81, lng: 2.12, name: 'INPI', country: 'FR', size: 0.6, color: '#429EBD' },
  { lat: 51.52, lng: -0.04, name: 'UKIPO', country: 'UK', size: 0.6, color: '#429EBD' },
  { lat: 38.90, lng: -77.02, name: 'USPTO', country: 'US', size: 0.8, color: '#FCA311' },
  { lat: 35.68, lng: 139.75, name: 'JPO', country: 'JP', size: 0.6, color: '#429EBD' },
  { lat: 52.52, lng: 13.40, name: 'DPMA', country: 'DE', size: 0.6, color: '#429EBD' },
  { lat: -23.55, lng: -46.63, name: 'INPI-BR', country: 'BR', size: 0.6, color: '#429EBD' },
  { lat: 1.35, lng: 103.82, name: 'IPOS', country: 'SG', size: 0.5, color: '#7BBDE8' },
  { lat: 37.57, lng: 126.98, name: 'KIPO', country: 'KR', size: 0.5, color: '#7BBDE8' },
  { lat: 46.95, lng: 7.45, name: 'IGE', country: 'CH', size: 0.5, color: '#7BBDE8' },
  { lat: 46.23, lng: 2.21, name: 'EUIPO', country: 'EU', size: 0.9, color: '#FCA311' },
  { lat: 46.23, lng: 8.22, name: 'WIPO', country: 'INT', size: 1.0, color: '#FCA311' },
]

// Generate ~190 minor jurisdiction points spread globally
function generateMinorPoints() {
  const points: { lat: number; lng: number; name: string; country: string; size: number; color: string }[] = []
  // Seed locations across continents
  const regions = [
    // Europe
    ...Array.from({ length: 25 }, () => ({ lat: 42 + Math.random() * 18, lng: -8 + Math.random() * 38 })),
    // Asia
    ...Array.from({ length: 30 }, () => ({ lat: 10 + Math.random() * 40, lng: 60 + Math.random() * 80 })),
    // Africa
    ...Array.from({ length: 25 }, () => ({ lat: -30 + Math.random() * 55, lng: -15 + Math.random() * 50 })),
    // North America
    ...Array.from({ length: 20 }, () => ({ lat: 15 + Math.random() * 40, lng: -130 + Math.random() * 70 })),
    // South America
    ...Array.from({ length: 20 }, () => ({ lat: -40 + Math.random() * 45, lng: -80 + Math.random() * 40 })),
    // Oceania
    ...Array.from({ length: 10 }, () => ({ lat: -40 + Math.random() * 25, lng: 110 + Math.random() * 50 })),
    // Middle East
    ...Array.from({ length: 15 }, () => ({ lat: 20 + Math.random() * 20, lng: 35 + Math.random() * 25 })),
    // Central Asia
    ...Array.from({ length: 15 }, () => ({ lat: 30 + Math.random() * 20, lng: 50 + Math.random() * 40 })),
    // Caribbean & Central America
    ...Array.from({ length: 10 }, () => ({ lat: 10 + Math.random() * 15, lng: -90 + Math.random() * 30 })),
    // Nordic/Baltic
    ...Array.from({ length: 10 }, () => ({ lat: 55 + Math.random() * 15, lng: 5 + Math.random() * 30 })),
    // Southeast Asia specific
    ...Array.from({ length: 10 }, () => ({ lat: -5 + Math.random() * 20, lng: 95 + Math.random() * 35 })),
  ]
  regions.forEach((r, i) => {
    points.push({
      lat: r.lat,
      lng: r.lng,
      name: '',
      country: `P${i}`,
      size: 0.15 + Math.random() * 0.2,
      color: 'rgba(66, 158, 189, 0.4)',
    })
  })
  return points
}

const connectionArcs = [
  { startLat: 40.41, startLng: -3.70, endLat: 38.90, endLng: -77.02, color: ['#FCA311', '#429EBD'] },
  { startLat: 48.81, startLng: 2.12, endLat: 35.68, endLng: 139.75, color: ['#429EBD', '#7BBDE8'] },
  { startLat: 51.52, startLng: -0.04, endLat: -23.55, endLng: -46.63, color: ['#429EBD', '#FCA311'] },
  { startLat: 52.52, startLng: 13.40, endLat: 1.35, endLng: 103.82, color: ['#7BBDE8', '#429EBD'] },
  { startLat: 46.23, startLng: 2.21, endLat: 37.57, endLng: 126.98, color: ['#FCA311', '#7BBDE8'] },
  { startLat: 46.23, startLng: 8.22, endLat: 40.41, endLng: -3.70, color: ['#FCA311', '#FCA311'] },
]

// SVG fallback for mobile / no-WebGL
function GlobeFallbackSVG() {
  const points = [
    { cx: '35%', cy: '42%', label: 'ES' },
    { cx: '38%', cy: '35%', label: 'FR' },
    { cx: '40%', cy: '33%', label: 'UK' },
    { cx: '22%', cy: '38%', label: 'US' },
    { cx: '78%', cy: '36%', label: 'JP' },
    { cx: '42%', cy: '34%', label: 'DE' },
    { cx: '30%', cy: '62%', label: 'BR' },
    { cx: '70%', cy: '52%', label: 'SG' },
    { cx: '75%', cy: '38%', label: 'KR' },
    { cx: '40%', cy: '36%', label: 'CH' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '1', margin: '0 auto' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        {/* Globe circle */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(66,158,189,0.15)" strokeWidth="1" />
        <circle cx="100" cy="100" r="90" fill="rgba(66,158,189,0.03)" />
        {/* Grid lines */}
        <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="rgba(66,158,189,0.08)" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="100" cy="100" rx="30" ry="90" fill="none" stroke="rgba(66,158,189,0.08)" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="25s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="100" cy="100" rx="60" ry="90" fill="none" stroke="rgba(66,158,189,0.06)" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite" />
        </ellipse>
        {/* Office points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="2.5" fill="#FCA311" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={p.cx} cy={p.cy} r="5" fill="none" stroke="#FCA311" strokeWidth="0.5" opacity="0.3">
              <animate attributeName="r" values="3;8;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  )
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export default function Globe3D() {
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [canWebGL, setCanWebGL] = useState(true)
  const [hovered, setHovered] = useState<typeof mainOffices[0] | null>(null)

  const allPoints = useMemo(() => [...mainOffices, ...generateMinorPoints()], [])
  // On mobile, reduce points
  const points = useMemo(() => isMobile ? mainOffices : allPoints, [isMobile, allPoints])
  const arcs = useMemo(() => isMobile ? [] : connectionArcs, [isMobile])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    setCanWebGL(hasWebGL())

    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lazy mount: only render when in viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Configure globe after mount
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    // Auto-rotation
    const controls = globe.controls()
    if (controls) {
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.3
      controls.enableZoom = false
    }

    // Point of view — show Europe/Atlantic initially
    globe.pointOfView({ lat: 30, lng: 10, altitude: 2.2 }, 0)
  }, [isVisible, canWebGL, isMobile])

  const handlePointHover = useCallback((point: any) => {
    if (point && mainOffices.some(o => o.name === point.name)) {
      setHovered(point)
      // Pause auto-rotation
      const controls = globeRef.current?.controls()
      if (controls) controls.autoRotate = false
    } else {
      setHovered(null)
      const controls = globeRef.current?.controls()
      if (controls) controls.autoRotate = true
    }
  }, [])

  if (isMobile || !canWebGL) {
    return (
      <div ref={containerRef} role="img" aria-label="Globo 3D mostrando 200+ jurisdicciones IP conectadas a IP-NEXUS">
        <GlobeFallbackSVG />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '1', margin: '0 auto' }}
      role="img"
      aria-label="Globo 3D interactivo mostrando 200+ jurisdicciones IP conectadas a IP-NEXUS"
    >
      {/* Teal halo behind globe */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%',
        height: '120%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(66,158,189,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {isVisible && (
        <Suspense fallback={<GlobeFallbackSVG />}>
          <ReactGlobe
            ref={globeRef}
            width={480}
            height={480}
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere={true}
            atmosphereColor="#429EBD"
            atmosphereAltitude={0.25}
            showGraticules={true}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            // Points
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.01}
            pointRadius={(d: any) => d.size * 0.4}
            pointsMerge={false}
            onPointHover={handlePointHover}
            // Arcs
            arcsData={arcs}
            arcColor="color"
            arcAltitude={0.15}
            arcStroke={0.5}
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={3000}
            arcDashInitialGap={() => Math.random()}
            // Rings (pulse effect on main offices)
            ringsData={mainOffices}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => (t: number) => `rgba(252, 163, 17, ${1 - t})`}
            ringMaxRadius={3}
            ringPropagationSpeed={2}
            ringRepeatPeriod={2000}
            // Labels
            labelsData={mainOffices}
            labelLat="lat"
            labelLng="lng"
            labelText="name"
            labelSize={0.8}
            labelColor={() => 'rgba(255, 255, 255, 0.5)'}
            labelDotRadius={0.3}
            labelAltitude={0.015}
            rendererConfig={{ antialias: true, alpha: true }}
          />
        </Suspense>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          backdropFilter: 'blur(24px)',
          padding: '12px 16px',
          zIndex: 10,
          minWidth: 160,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{hovered.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{hovered.country}</div>
          <div style={{ fontSize: 11, color: '#10B981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Conectada a IP-NEXUS
          </div>
        </div>
      )}
    </div>
  )
}
