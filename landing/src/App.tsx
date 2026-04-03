import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MetricsBar from './components/MetricsBar'
import DashboardPreview from './components/DashboardPreview'
import ModulesBento from './components/ModulesBento'
import GeniusDemo from './components/GeniusDemo'
import Surveillance from './components/Surveillance'
import IPMarket from './components/IPMarket'
import ClientPortal from './components/ClientPortal'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Security from './components/Security'
import ScheduleDemo from './components/ScheduleDemo'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <a
        href="#main"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
        onFocus={(e) => {
          const el = e.currentTarget
          el.style.width = 'auto'
          el.style.height = 'auto'
          el.style.clip = 'auto'
          el.style.overflow = 'visible'
          el.style.zIndex = '60'
          el.style.position = 'absolute'
          el.style.top = '16px'
          el.style.left = '16px'
          el.style.background = '#FCA311'
          el.style.color = '#0C1425'
          el.style.padding = '8px 16px'
          el.style.borderRadius = '8px'
          el.style.fontWeight = '600'
        }}
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <MetricsBar />
        <DashboardPreview />
        <ModulesBento />
        <GeniusDemo />
        <Surveillance />
        <IPMarket />
        <ClientPortal />
        <Pricing />
        <FAQ />
        <Security />
        <ScheduleDemo />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
