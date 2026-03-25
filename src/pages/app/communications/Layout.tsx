import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Mail, MessageSquare, SlidersHorizontal, LayoutList, FileText, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app/communications", label: "Inbox", icon: LayoutList, end: true },
  { to: "/app/communications/internal", label: "Chat Interno", icon: MessageCircle },
  { to: "/app/communications/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { to: "/app/communications/email", label: "Email", icon: Mail },
  { to: "/app/communications/templates", label: "Templates", icon: FileText },
  { to: "/app/communications/settings", label: "Config", icon: SlidersHorizontal },
];

export default function CommunicationsLayout() {
  const location = useLocation();
  const isUnifiedInbox = location.pathname === '/app/communications';

  return (
    <div className={cn("space-y-0", isUnifiedInbox && "space-y-0")}>
      {!isUnifiedInbox && (
        <header className="space-y-1 px-6 pt-4">
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground">Gestión omnicanal de comunicaciones</p>
        </header>
      )}
      {/* CAMBIO 6 — Tabs superiores sticky */}
      <nav
        className="sticky top-0 z-10 flex flex-wrap gap-1 bg-white px-6 py-2"
        style={{
          borderBottom: '2px solid #F1F5F9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b-2",
                isActive
                  ? "border-b-[#3B82F6] text-[#2563EB] font-semibold"
                  : "border-b-transparent text-[#64748B] hover:text-[#374151] hover:bg-[#F8FAFC] rounded-t-lg"
              )
            }
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </NavLink>
        ))}
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
