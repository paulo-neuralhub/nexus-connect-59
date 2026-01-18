import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck,
  Clock,
  Eye,
  Settings,
  Trash2,
  DollarSign,
  Users,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useNotifications, 
  useUnreadNotificationsCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification
} from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications';

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  deadline_reminder: Clock,
  renewal_reminder: Clock,
  watch_alert: Eye,
  invoice: DollarSign,
  team_invite: Users,
  team_update: Users,
  system: Bell,
  marketing: FileText,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  deadline_reminder: '#EF4444',
  renewal_reminder: '#F59E0B',
  watch_alert: '#8B5CF6',
  invoice: '#22C55E',
  team_invite: '#3B82F6',
  team_update: '#3B82F6',
  system: '#6B7280',
  marketing: '#EC4899',
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };
  
  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-card rounded-xl shadow-xl border z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                )}
                <Link
                  to="/app/settings/notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
            
            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted mb-2" />
                  <p className="text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      onDelete={() => handleDelete(notification.id)}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t shrink-0">
                <Link
                  to="/app/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onClose 
}: { 
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const color = NOTIFICATION_COLORS[notification.type] || '#6B7280';
  
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead();
    }
    if (notification.action_url) {
      onClose();
    }
  };
  
  const content = (
    <div 
      className={cn(
        "p-3 hover:bg-muted/50 flex gap-3 cursor-pointer transition-colors group",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm text-foreground",
            !notification.is_read && "font-medium"
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{notification.body}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true,
            locale: es 
          })}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-start gap-1 shrink-0">
        {!notification.is_read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}
            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Marcar como leída"
          >
            <Check className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
  
  if (notification.action_url) {
    return (
      <Link to={notification.action_url} className="block">
        {content}
      </Link>
    );
  }
  
  return <div>{content}</div>;
}
