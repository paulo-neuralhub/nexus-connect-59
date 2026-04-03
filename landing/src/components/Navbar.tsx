import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  { num: '01', label: 'Plataforma', href: '#dashboard' },
  { num: '02', label: 'Módulos', href: '#modulos' },
  { num: '03', label: 'Precios', href: '#precios' },
  { num: '04', label: 'Seguridad', href: '#seguridad' },
  { num: '05', label: 'Agendar Demo', href: '#agendar-demo' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 ${
        scrolled
          ? 'bg-ink/80 backdrop-blur-2xl border-b border-glass-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-gold to-amber flex items-center justify-center">
            <span className="text-ink font-bold text-[13px]">IP</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">IP-NEXUS</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.num}
              href={item.href}
              className="group flex items-center gap-1.5 relative py-1"
            >
              <span className="font-mono text-[11px] text-gold font-semibold tracking-wider">{item.num}</span>
              <span className="text-[14px] text-white/50 group-hover:text-white transition-colors duration-200">
                {item.label}
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">Acceder</Link>
          <a href="#hero" className="btn-gold !py-2.5 !px-5 !text-[13px]">Prueba Gratuita →</a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-ink/95 backdrop-blur-2xl z-40 p-8 flex flex-col gap-6">
          {navItems.map((item) => (
            <a
              key={item.num}
              href={item.href}
              className="flex items-center gap-3 text-lg"
              onClick={() => setMobileOpen(false)}
            >
              <span className="font-mono text-xs text-gold">{item.num}</span>
              <span className="text-white/70">{item.label}</span>
            </a>
          ))}
          <div className="mt-auto flex flex-col gap-3">
            <a href="#" className="btn-gold text-center">Prueba Gratuita →</a>
            <Link to="/login" className="btn-glass text-center">Acceder</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
