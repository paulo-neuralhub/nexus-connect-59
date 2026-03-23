import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brain, MessageSquare, FileText, History, Cpu, ArrowLeft, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/contexts/page-context';
import { useEffect, useCallback } from 'react';
import { ModuleGate } from '@/components/common/ModuleGate';

import { useLegalCheck } from '@/hooks/legal/useLegalCheck';

const geniusNav = [
  { path: '/app/genius/studio', label: 'Agentes', icon: Cpu, highlight: true },
  { path: '/app/genius', label: 'Chat', icon: MessageSquare, exact: true },
  { path: '/app/genius/documents-gen', label: 'Documentos', icon: FileText },
  { path: '/app/genius/documents', label: 'Historial', icon: History },
];

export default function GeniusLayout() {
  const { setTitle } = usePageTitle();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleDeclineLegal = useCallback(() => {
    navigate('/app/dashboard');
  }, [navigate]);
  
  const { needsAcceptance, modal, isChecking } = useLegalCheck('ai_disclaimer', {
    onDecline: handleDeclineLegal,
  });

  useEffect(() => {
    setTitle('IP-GENIUS PRO');
  }, [setTitle]);

  if (isChecking) return null;
  if (needsAcceptance) return <>{modal}</>;

  const isStudio = location.pathname.includes('/studio');

  return (
    <ModuleGate module="genius">
      {modal}
      {isStudio ? (
        <div className="h-full flex flex-col">
          {/* Compact nav bar in studio mode */}
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/genius')}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-xs">Genius</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <nav className="flex items-center gap-1">
              {geniusNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      item.highlight && isActive
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                        : item.highlight && !isActive
                        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20"
                        : isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with navigation */}
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">IP-GENIUS</h1>
                <p className="text-sm text-muted-foreground">Asistentes IA especializados en PI</p>
              </div>
            </div>
            
            {/* Sub-navigation */}
            <nav className="flex items-center gap-1 ml-8 border rounded-lg p-1 bg-muted/50">
              {geniusNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                      item.highlight && isActive
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                        : item.highlight && !isActive
                        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20"
                        : isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <Outlet />
        </div>
      )}
    </ModuleGate>
  );
}
