import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brain, MessageSquare, FileText, History, Cpu, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/contexts/page-context';
import { useEffect, useCallback } from 'react';
import { ModuleGate } from '@/components/common/ModuleGate';
import { useLegalCheck } from '@/hooks/legal/useLegalCheck';

const geniusNav = [
  { path: '/app/genius/studio', label: 'Agentes', icon: Cpu },
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
    setTitle('IP-GENIUS');
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
              <span className="text-xs">Chat</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <p className="text-xs text-muted-foreground">
              Clica en un agente para hablarle directamente
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with nav buttons */}
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GENIUS IP</h1>
                <p className="text-sm text-muted-foreground">Asistentes IA especializados en PI</p>
              </div>
            </div>
            
            <nav className="ml-8 flex items-center gap-2">
              {geniusNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                const isAgentes = item.path.includes('/studio');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isAgentes
                        ? isActive
                          ? "bg-[hsl(263,70%,50%)] text-white shadow-[0_4px_14px_-3px_hsl(263,70%,50%/0.5)]"
                          : "bg-[hsl(263,70%,50%)/0.12] text-[hsl(263,70%,50%)] border border-[hsl(263,70%,50%)/0.3] hover:bg-[hsl(263,70%,50%)/0.2] shadow-[2px_2px_6px_#cdd1dc,-2px_-2px_6px_#ffffff]"
                        : isActive
                          ? "bg-sidebar text-sidebar-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
