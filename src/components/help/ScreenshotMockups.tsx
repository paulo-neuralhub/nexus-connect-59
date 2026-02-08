// ============================================================
// IP-NEXUS HELP - SCREENSHOT MOCKUPS FOR TUTORIALS
// Simplified UI mockups to illustrate steps
// ============================================================

export function MockupCreateMatter() {
  return (
    <div className="bg-background rounded-lg border border-border p-5 max-w-md mx-auto shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">+</span>
        </div>
        <span className="text-sm font-semibold text-foreground">Nuevo expediente</span>
      </div>
      <div className="mb-3">
        <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Tipo de PI</label>
        <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 relative">
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold shadow-sm">🏷️ Marca</span>
            <span className="px-3 py-1.5 rounded-lg bg-background border border-border text-[11px] text-muted-foreground">📋 Patente</span>
            <span className="px-3 py-1.5 rounded-lg bg-background border border-border text-[11px] text-muted-foreground">🎨 Diseño</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Nombre de la marca', placeholder: 'Ej: AURORA' },
          { label: 'Cliente', placeholder: 'Seleccionar contacto...' },
          { label: 'Jurisdicción', placeholder: 'Unión Europea (EUIPO)' },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
            <div className="h-9 rounded-lg border border-border bg-muted/50 px-3 flex items-center">
              <span className="text-xs text-muted-foreground">{field.placeholder}</span>
            </div>
          </div>
        ))}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Clases Niza</label>
          <div className="flex gap-1.5">
            {['9', '35', '42'].map((c) => (
              <span key={c} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{c}</span>
            ))}
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px]">+ Añadir</span>
          </div>
        </div>
      </div>
      <button className="w-full mt-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm">
        Crear expediente
      </button>
    </div>
  );
}

export function MockupDashboard() {
  return (
    <div className="bg-background rounded-lg border border-border p-4 max-w-lg mx-auto shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Dashboard</span>
        <span className="text-[10px] text-muted-foreground">Hoy</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Expedientes activos', value: '47', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Plazos esta semana', value: '3', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pendientes', value: '8', color: 'text-red-600', bg: 'bg-red-50' },
        ].map((kpi) => (
          <div key={kpi.label} className={`p-3 rounded-lg ${kpi.bg}`}>
            <span className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">{kpi.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockupSpiderAlerts() {
  return (
    <div className="bg-background rounded-lg border border-border p-4 max-w-md mx-auto shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-xs">🕷️</span>
        </div>
        <span className="text-sm font-semibold text-foreground">Alertas de vigilancia</span>
        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">3 nuevas</span>
      </div>
      <div className="space-y-2">
        {[
          { type: 'Similitud', mark: 'AURORA TECH', risk: 'Alto', bg: 'bg-red-50', text: 'text-red-600' },
          { type: 'Publicación', mark: 'NEXUS PRO', risk: 'Medio', bg: 'bg-amber-50', text: 'text-amber-600' },
          { type: 'Cambio estado', mark: 'STELLAR IP', risk: 'Info', bg: 'bg-blue-50', text: 'text-blue-600' },
        ].map((alert) => (
          <div key={alert.mark} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex-1">
              <span className="text-xs font-medium text-foreground">{alert.mark}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{alert.type}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.bg} ${alert.text}`}>
              {alert.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
