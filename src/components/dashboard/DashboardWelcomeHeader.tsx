// =============================================
// COMPONENTE: DashboardWelcomeHeader
// Card de bienvenida — SILK v2 Design System
// =============================================

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { ChevronDown, Settings, LogOut, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";
import { GlobalSearchTrigger } from "@/components/search";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardWelcomeHeaderProps {
  plazosEstaSemana?: number;
}

export function DashboardWelcomeHeader({ plazosEstaSemana = 0 }: DashboardWelcomeHeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Usuario';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const fechaActual = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div
      className="rounded-[14px] border mb-4 px-[18px] py-4"
      style={{ background: '#ffffff', borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center justify-between">
        
        {/* Left: Greeting */}
        <div>
          <h1
            className="text-2xl font-light mb-1"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {getGreeting()}, <span className="font-bold">{firstName}</span>
          </h1>
          <p className="text-[12px]">
            <span className="font-semibold" style={{ color: '#00b4d8' }}>
              {plazosEstaSemana} plazos esta semana
            </span>
            <span className="mx-2" style={{ color: 'hsl(var(--text-tertiary))' }}>·</span>
            <span className="capitalize" style={{ color: 'hsl(var(--text-secondary))' }}>{fechaActual}</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          
          <div className="hidden md:block">
            <GlobalSearchTrigger className="w-64 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white" />
          </div>
          
          <div className="md:hidden">
            <GlobalSearchTrigger variant="compact" />
          </div>
          
          <ThemeToggle />
          <NotificationBell />

          <div className="h-6 w-px hidden sm:block" style={{ background: 'hsl(var(--border))' }} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-400 text-xs text-white font-semibold">
                    {getInitials(profile?.full_name || profile?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="hidden text-[12px] font-medium sm:inline"
                  style={{ color: 'hsl(var(--text-primary))' }}
                >
                  {firstName}
                </span>
                <ChevronDown className="h-3 w-3" style={{ color: 'hsl(var(--text-tertiary))' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/app/settings/profile')}>
                <UserCircle className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </div>
  );
}
