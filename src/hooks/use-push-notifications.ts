import { useState, useCallback, useEffect } from 'react';
import { useSavePushSubscription } from '@/hooks/use-notifications';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const saveMutation = useSavePushSubscription();
  
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      getExistingSubscription();
    }
  }, []);
  
  const getExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setSubscription(existing);
    } catch (error) {
      console.error('Error getting subscription:', error);
    }
  };
  
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [isSupported]);
  
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted' || !VAPID_PUBLIC_KEY) return false;
    
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Desuscribir si existe
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }
      
      // Nueva suscripción
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      setSubscription(newSubscription);
      
      // Guardar en servidor
      await saveMutation.mutateAsync(newSubscription.toJSON());
      
      return true;
    } catch (error) {
      console.error('Subscribe failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, saveMutation]);
  
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;
    
    setIsLoading(true);
    
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);
  
  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') return;
    
    // Notificación local de prueba
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('IP-NEXUS', {
      body: '¡Las notificaciones están funcionando!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test',
    });
  }, [permission]);
  
  return {
    permission,
    subscription,
    isSupported,
    isLoading,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray.buffer as ArrayBuffer;
}
