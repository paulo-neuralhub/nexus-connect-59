import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebApp);
    };

    // Detect iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkInstalled();
    checkIOS();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    return false;
  }, [installPrompt]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    isInstalled,
    canInstall: !!installPrompt,
    isIOS,
    needRefresh,
    install,
    dismissUpdate,
    applyUpdate,
  };
}

export function usePWAInstallVisits() {
  const [visitCount, setVisitCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const storedCount = localStorage.getItem('pwa-visit-count');
    const storedDismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (storedDismissed) {
      setDismissed(true);
      return;
    }

    const count = storedCount ? parseInt(storedCount, 10) + 1 : 1;
    setVisitCount(count);
    localStorage.setItem('pwa-visit-count', count.toString());
  }, []);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  const shouldShowPrompt = visitCount >= 2 && !dismissed;

  return {
    visitCount,
    shouldShowPrompt,
    dismissInstall,
  };
}
