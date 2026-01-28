import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { KanbanSquare, Settings2 } from 'lucide-react';
import { ModuleGate } from '@/components/common/ModuleGate';
import { InlineHelp } from '@/components/help';

// Navegación simplificada: Solo Kanban (principal) y Configuración de Pipelines
const navItems = [
  { 
    to: '/app/crm', 
    label: 'Kanban', 
    icon: KanbanSquare, 
    exact: true,
    help: 'Vista unificada de Leads y Deals en un flujo continuo.'
  },
  { 
    to: '/app/crm/pipelines', 
    label: 'Configurar Pipelines', 
    icon: Settings2,
    help: 'Personaliza las etapas de tu proceso de ventas.'
  },
];

export default function CRMLayout() {
  const location = useLocation();
  
  // Determinar si estamos en una sub-ruta de detalle (no mostrar tabs)
  const isDetailRoute = location.pathname.match(/\/app\/crm\/(accounts|contacts|deals|leads)\/[^/]+/);
  
  return (
    <ModuleGate module="crm">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground">Gestión unificada de Leads y Deals</p>
        </div>
        
        {/* Sub-navigation - Solo mostrar en rutas principales */}
        {!isDetailRoute && (
          <div className="border-b">
            <nav className="flex gap-6 -mb-px overflow-x-auto">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.help && <InlineHelp text={item.help} side="bottom" />}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content */}
        <Outlet />
      </div>
    </ModuleGate>
  );
}
