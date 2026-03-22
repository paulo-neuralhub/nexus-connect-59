import * as React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/layout/auth-guard";
import { OrgGuard } from "@/components/layout/org-guard";
import { DynamicSidebar } from "@/components/layout/DynamicSidebar";
import { Header } from "@/components/layout/header";
import { PageProvider } from "@/contexts/page-context";
import { useIsMobile, useNetworkStatus, useViewportHeight } from "@/hooks/use-mobile";
import { MobileBottomNav, OfflineBanner, PWAInstallPrompt } from "@/components/mobile";
import { ContextualHelpProvider } from "@/components/help/ContextualHelpProvider";
import { TrialBanner } from "@/components/upgrade/TrialBanner";
import { AlertBanner } from "@/components/alerts/AlertBanner";
import { CoPilotWidget, CoPilotGuide } from "@/components/copilot";
import { CoPilotAvatar } from "@/components/copilot/CoPilotAvatar";
import { GlobalTimer } from "@/components/timetracking";
import { usePresence } from "@/hooks/use-realtime-collab";
import { usePageTracking } from "@/hooks/usePageTracking";
import { PageContainer } from "@/components/layout/PageContainer";
import { IPSoftphone } from "@/components/telephony/IPSoftphone";
import { CallManager } from "@/components/telephony/CallManager";
import { ModuleActivationDialog } from "@/components/modules";
import { DemoTourNavigator, DemoScreenAnnotation } from "@/components/demo";
import { useOrganization } from "@/contexts/organization-context";
import { useIsDemoMode } from "@/hooks/backoffice/useDemoMode";
import { useCopilot } from "@/hooks/use-copilot";

export function AppLayout() {
  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [annotationActive, setAnnotationActive] = React.useState(false);
  
  const { currentOrganization } = useOrganization();
  const { isDemoMode, config } = useIsDemoMode(currentOrganization?.id, currentOrganization?.slug);
  
  usePresence();
  usePageTracking();
  useViewportHeight();

  // ── CoPilot state ──────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [showGreeting, setShowGreeting] = React.useState(false);
  const [greetingMessage, setGreetingMessage] = React.useState('');

  const copilotData = useCopilot();
  const copilotMode = (copilotData.mode === 'pro' ? 'pro' : 'basic') as 'basic' | 'pro';
  const urgentCount = copilotData.urgentCount ?? 0;

  React.useEffect(() => {
    const today = new Date().toDateString();
    const lastGreeted = localStorage.getItem('copilot_greeted_v2');
    if (lastGreeted === today) return;

    const timer = setTimeout(() => {
      localStorage.setItem('copilot_greeted_v2', today);
      const hour = new Date().getHours();
      const saludo = hour < 12 ? 'Buenos días ☀️'
                   : hour < 20 ? 'Buenas tardes 🌤️'
                   : 'Buenas noches 🌙';
      const msg = urgentCount > 0
        ? `${saludo} He detectado ${urgentCount} item${urgentCount > 1 ? 's' : ''} urgentes hoy.`
        : `${saludo} Todo en orden hoy. ✅`;
      setGreetingMessage(msg);
      setShowGreeting(true);
      const dismiss = setTimeout(() => setShowGreeting(false), 8000);
      return () => clearTimeout(dismiss);
    }, 1500);

    return () => clearTimeout(timer);
  }, [urgentCount]);

  React.useEffect(() => {
    const handleClose = () => setIsChatOpen(false);
    window.addEventListener('close-copilot-chat', handleClose);
    return () => window.removeEventListener('close-copilot-chat', handleClose);
  }, []);
  

  return (
    <AuthGuard>
      <OrgGuard>
        <PageProvider>
          <ContextualHelpProvider>
            
            {isMobile ? (
              // Mobile Layout
              <div 
                className="h-screen-mobile flex flex-col bg-background overflow-hidden"
              >
                {/* Offline Banner */}
                {!isOnline && <OfflineBanner />}
                
                {/* Mobile Header (P-UI-03) */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Sidebar - Mobile overlay */}
                {sidebarOpen && (
                  <div className="fixed inset-0 z-50 md:hidden">
                    <button
                      type="button"
                      className="absolute inset-0 bg-foreground/30"
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Cerrar menú"
                    />
                    <div className="absolute left-0 top-0 h-full">
                      <DynamicSidebar
                        variant="mobile"
                        collapsed={false}
                        onNavigate={() => setSidebarOpen(false)}
                      />
                    </div>
                  </div>
                )}
                
                {/* Main Content - scrollable */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none">
                  <PageContainer padding="sm" className="pb-20">
                    <Outlet />
                  </PageContainer>
                </main>
                
                {/* Bottom Navigation with FAB */}
                <MobileBottomNav />
                
                {/* PWA Install Prompt */}
                <PWAInstallPrompt />
                
                {/* Global Timer for mobile */}
                <GlobalTimer />

                <IPSoftphone />
                
                {/* Demo Mode Components */}
                {isDemoMode && (
                  <>
                    <DemoTourNavigator 
                      onToggleAnnotation={() => setAnnotationActive(v => !v)}
                      isAnnotationActive={annotationActive}
                    />
                    <DemoScreenAnnotation 
                      isActive={annotationActive} 
                      onClose={() => setAnnotationActive(false)} 
                    />
                  </>
                )}
              </div>
            ) : (
              // SILK Desktop Shell - Fixed layout with no gaps
              <div 
                className="h-screen flex overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #f1f4f9, #ebeef5)',
                }}
              >
                {/* Sidebar - Fixed position, full height */}
                <DynamicSidebar
                  variant="desktop"
                  collapsed={sidebarCollapsed}
                  onToggleCollapsed={() => setSidebarCollapsed(v => !v)}
                />
                
                {/* SILK: Content area - flex-1 fills remaining space, no margin needed since sidebar is fixed */}
                <div 
                  className={cn(
                    "flex-1 flex flex-col h-screen overflow-hidden",
                    sidebarCollapsed ? "ml-16" : "ml-[230px]"
                  )}
                >
                  <AlertBanner />
                  <TrialBanner />
                  <Header />
                  {/* SILK: Main content area with independent scroll */}
                  <main 
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ 
                      padding: '24px',
                      background: '#f1f4f9',
                    }}
                  >
                    <Outlet />
                  </main>
                </div>
                {/* COPILOT AVATAR — siempre visible, arrastrable */}
                <CoPilotAvatar
                  copilotMode={copilotMode}
                  isChatOpen={isChatOpen}
                  showGreeting={showGreeting}
                  greetingMessage={greetingMessage}
                  urgentCount={urgentCount}
                  bubbleState={
                    isChatOpen ? 'standby'
                    : urgentCount > 0 ? 'attentive'
                    : 'standby'
                  }
                  onAvatarClick={() => {
                    console.log('[TEST] onAvatarClick called, isChatOpen was:', isChatOpen)
                    setIsChatOpen(prev => !prev);
                    setShowGreeting(false);
                  }}
                  onGreetingView={() => {
                    setShowGreeting(false);
                    setIsChatOpen(true);
                  }}
                  onGreetingLater={() => setShowGreeting(false)}
                />

                {/* COPILOT CHAT PANEL — separado del avatar */}
                {isChatOpen && (
                  <CoPilotWidget
                    isOpen={isChatOpen}
                    onClose={() => {
                      setIsChatOpen(false);
                      window.dispatchEvent(new Event('close-copilot-chat'));
                    }}
                  />
                )}
                <CoPilotGuide />

                <IPSoftphone />
                
                {/* Click-to-Call Manager */}
                <CallManager />
                
                {/* Module Activation Dialog */}
                <ModuleActivationDialog />
                
                {/* Demo Mode Components */}
                {isDemoMode && (
                  <>
                    <DemoTourNavigator 
                      onToggleAnnotation={() => setAnnotationActive(v => !v)}
                      isAnnotationActive={annotationActive}
                    />
                    <DemoScreenAnnotation 
                      isActive={annotationActive} 
                      onClose={() => setAnnotationActive(false)} 
                    />
                  </>
                )}
              </div>
            )}
          </ContextualHelpProvider>
        </PageProvider>
      </OrgGuard>
    </AuthGuard>
  );
}