import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  Users, 
  Calendar, 
  Settings,
  TrendingUp,
  Wallet,
  Package,
  BookOpen,
  FileSpreadsheet,
  Landmark,
  Shield,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleGate } from '@/components/common/ModuleGate';
import { InlineHelp } from '@/components/help';
import { useFinanceModuleConfig } from '@/hooks/finance/useFinanceModuleConfig';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const basicNavItems = [
  { to: '/app/finance', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/finance/costs', icon: Receipt, label: 'Costes' },
  { to: '/app/finance/invoices', icon: FileText, label: 'Facturas' },
  { to: '/app/finance/quotes', icon: FileText, label: 'Presupuestos' },
  { to: '/app/finance/expenses', icon: Wallet, label: 'Gastos' },
  { to: '/app/finance/provisions', icon: Wallet, label: 'Provisiones' },
  { to: '/app/finance/services', icon: Package, label: 'Servicios' },
  { to: '/app/finance/clients', icon: Users, label: 'Clientes' },
  { to: '/app/finance/renewals', icon: Calendar, label: 'Renovaciones' },
  { to: '/app/finance/valuation', icon: TrendingUp, label: 'Valoración' },
  { to: '/app/finance/settings', icon: Settings, label: 'Configuración' },
];

const advancedAccountingItems = [
  { to: '/app/finance/accounting', icon: BookOpen, label: 'Libro Diario' },
  { to: '/app/finance/accounting/chart', icon: FileSpreadsheet, label: 'Plan de Cuentas' },
  { to: '/app/finance/bank', icon: Landmark, label: 'Cuentas Bancarias' },
];

const advancedReportsItems = [
  { to: '/app/finance/reports/vat', icon: FileText, label: 'Libro IVA' },
  { to: '/app/finance/reports/verifactu', icon: Shield, label: 'Verifactu' },
];

function NavItem({ item, disabled }: { item: { to: string; icon: any; label: string; end?: boolean }; disabled?: boolean }) {
  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-muted-foreground/50 cursor-not-allowed">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              <Lock className="w-3 h-3 ml-auto" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Disponible en plan Advanced</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <item.icon className="w-4 h-4" />
      {item.label}
    </NavLink>
  );
}

export default function FinanceLayout() {
  const { data: config } = useFinanceModuleConfig();
  const hasAccounting = config?.feature_accounting ?? false;
  const hasBankRec = config?.feature_bank_reconciliation ?? false;

  return (
    <ModuleGate module="finance">
      <div className="flex h-full">
        <div className="w-56 border-r bg-muted/30 flex-shrink-0">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Finance</h2>
              <InlineHelp text="Gestión financiera completa: control de costes, facturación, presupuestos, renovaciones y valoración de tu cartera de PI." />
            </div>
            <nav className="space-y-1">
              {basicNavItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </nav>

            {/* Advanced: Contabilidad */}
            <div className="mt-6 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Contabilidad</p>
            </div>
            <nav className="space-y-1">
              {advancedAccountingItems.map((item) => (
                <NavItem key={item.to} item={item} disabled={item.to === '/app/finance/bank' ? !hasBankRec : !hasAccounting} />
              ))}
            </nav>

            {/* Advanced: Informes Fiscales */}
            <div className="mt-6 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Informes Fiscales</p>
            </div>
            <nav className="space-y-1">
              {advancedReportsItems.map((item) => (
                <NavItem key={item.to} item={item} disabled={!hasAccounting} />
              ))}
            </nav>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </ModuleGate>
  );
}
