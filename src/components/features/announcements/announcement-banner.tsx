import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { useActiveAnnouncements } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertOctagon,
};

const COLORS = {
  info: 'bg-primary text-primary-foreground',
  warning: 'bg-yellow-500 text-white',
  success: 'bg-green-500 text-white',
  error: 'bg-destructive text-destructive-foreground',
};

export function AnnouncementBanner() {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  // Cargar dismissed de localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_announcements');
    if (stored) {
      try {
        setDismissed(JSON.parse(stored));
      } catch {
        setDismissed([]);
      }
    }
  }, []);
  
  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };
  
  const bannerAnnouncements = announcements.filter(
    a => a.show_as_banner && !dismissed.includes(a.id)
  );
  
  if (bannerAnnouncements.length === 0) return null;
  
  const announcement = bannerAnnouncements[0];
  const Icon = ICONS[announcement.type as keyof typeof ICONS] || Info;
  const colorClass = COLORS[announcement.type as keyof typeof COLORS] || COLORS.info;
  
  return (
    <div className={cn(colorClass, 'px-4 py-2')}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{announcement.title}</span>
          <span className="text-sm opacity-90">—</span>
          <span className="text-sm opacity-90">{announcement.message}</span>
        </div>
        
        {announcement.is_dismissible && (
          <button
            onClick={() => handleDismiss(announcement.id)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
