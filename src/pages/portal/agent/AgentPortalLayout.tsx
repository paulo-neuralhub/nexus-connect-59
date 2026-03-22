/**
 * Agent Portal Layout — /portal/:slug/agent/*
 */
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Inbox, ShoppingBag, BarChart3, MessageSquare, LogOut, ChevronDown, Users } from 'lucide-react';
import { useAgentPortal, type AgentClient } from '@/hooks/useAgentPortal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createContext, useContext } from 'react';

// Re-export agent portal context so child pages can consume it
const AgentPortalContext = createContext<ReturnType<typeof useAgentPortal> | null>(null);
export const useAgentPortalContext = () => {
  const ctx = useContext(AgentPortalContext);
  if (!ctx) throw new Error('useAgentPortalContext must be used within AgentPortalLayout');
  return ctx;
};

export default function AgentPortalLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const portalState = useAgentPortal();
  const { agent, clients, activeClient, setActiveClient, globalKpis, isLoading } = portalState;

  const NAV = [
    { to: `/portal/${slug}/agent/dashboard`, icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: `/portal/${slug}/agent/matters`, icon: Briefcase, label: 'Expedientes' },
    { to: `/portal/${slug}/agent/inbox`, icon: Inbox, label: 'Instrucciones', badge: globalKpis.pending_instructions },
    { to: `/portal/${slug}/agent/storefront`, icon: ShoppingBag, label: 'Storefront' },
    { to: `/portal/${slug}/agent/analytics`, icon: BarChart3, label: 'Analytics' },
    { to: `/portal/${slug}/agent/messages`, icon: MessageSquare, label: 'Mensajes' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando portal del agente...</div>
      </div>
    );
  }

  return (
    <AgentPortalContext.Provider value={portalState}>
      <div className="min-h-screen flex bg-muted/30">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-background flex-shrink-0 flex flex-col">
          {/* Branding */}
          <div className="p-4 border-b">
            <h2 className="font-bold text-sm text-primary">{agent?.org_name || 'IP-NEXUS'}</h2>
            <p className="text-[10px] text-muted-foreground">Portal de Agente</p>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-left h-auto py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate text-sm font-medium">
                      {activeClient?.name || 'Todos los clientes'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem onClick={() => setActiveClient(null)}>
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium">Todos los clientes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {clients.map(client => (
                  <DropdownMenuItem key={client.id} onClick={() => setActiveClient(client)}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{client.name}</span>
                      {client.overdue_deadlines > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                          {client.overdue_deadlines}
                        </Badge>
                      )}
                      {client.overdue_deadlines === 0 && client.deadlines_next_30d > 0 && (
                        <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                          {client.deadlines_next_30d}
                        </Badge>
                      )}
                      {client.overdue_deadlines === 0 && client.deadlines_next_30d === 0 && (
                        <span className="text-emerald-500 text-xs">✓</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.badge != null && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{item.badge}</Badge>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t text-xs text-muted-foreground">
            <div className="font-medium text-foreground truncate">{agent?.agent_name}</div>
            <div className="truncate">{agent?.org_name}</div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AgentPortalContext.Provider>
  );
}
