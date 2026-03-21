import { Sparkles } from 'lucide-react';

export default function BackofficeGeniusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de IP-GENIUS</h1>
          <p className="text-muted-foreground">Configuración y monitoreo del módulo de IA — próximamente</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-12 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Módulo en desarrollo</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Aquí podrás gestionar prompts, modelos, costos y configuración del asistente IP-GENIUS PRO.
        </p>
      </div>
    </div>
  );
}
