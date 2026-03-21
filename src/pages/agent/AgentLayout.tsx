/**
 * Agent Area Layout — wraps /agent/* routes
 */
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, User, Wrench, Award, CreditCard, Star, Settings } from 'lucide-react';

const NAV = [
  { to: '/agent', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/agent/requests', icon: Inbox, label: 'Solicitudes' },
  { to: '/agent/profile', icon: User, label: 'Perfil' },
  { to: '/agent/services', icon: Wrench, label: 'Servicios' },
  { to: '/agent/credentials', icon: Award, label: 'Credenciales' },
  { to: '/agent/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/agent/reviews', icon: Star, label: 'Reviews' },
  { to: '/agent/settings', icon: Settings, label: 'Configuración' },
];

export default function AgentLayout() {
  return (
    <div className="min-h-screen flex bg-[#F8F9FC]">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-white flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm" style={{ color: '#10B981' }}>IP-MARKET Agent</h2>
          <p className="text-[10px] text-gray-400">Panel de gestión</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
