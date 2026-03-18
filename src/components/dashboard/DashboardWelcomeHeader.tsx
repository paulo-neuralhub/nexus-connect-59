// =============================================
// COMPONENTE: DashboardWelcomeHeader
// Card de bienvenida con saludo + búsqueda + notificaciones + perfil
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

  // Nombre del usuario
  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Usuario';

  // Saludo según hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // Fecha actual formateada
  const fechaActual = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 px-6 py-4">
      <div className="flex items-center justify-between">
        
        {/* Lado izquierdo: Saludo grande con fecha */}
        <div>
          <h1 className="text-2xl font-light text-slate-800 mb-1">
            {getGreeting()}, <span className="font-bold">{firstName}</span>
          </h1>
          <p className="text-sm">
            <span className="text-cyan-600 font-semibold">
              {plazosEstaSemana} plazos esta semana
            </span>
            <span className="text-slate-400 mx-2">·</span>
            <span className="text-slate-500 capitalize">{fechaActual}</span>
          </p>
        </div>

        {/* Lado derecho: Búsqueda + Theme + Notificaciones + Perfil */}
        <div className="flex items-center gap-4">
          
          {/* Búsqueda - Desktop */}
          <div className="hidden md:block">
            <GlobalSearchTrigger className="w-64 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white" />
          </div>
          
          {/* Mobile search button */}
          <div className="md:hidden">
            <GlobalSearchTrigger variant="compact" />
          </div>
          
          {/* Dark Mode Toggle */}
          <ThemeToggle />
          
          {/* Notificaciones */}
          <NotificationBell />

          {/* Separador */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-400 text-xs text-white font-semibold">
                    {getInitials(profile?.full_name || profile?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                  {firstName}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
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
