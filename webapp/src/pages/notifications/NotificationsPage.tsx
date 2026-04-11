import { useNotifications } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  CheckCircle2,
  Receipt,
  AlertCircle,
  ClipboardCheck,
  BellOff,
  Check,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatters';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'task_assigned':
      return <ClipboardCheck className="h-4 w-4 text-blue-400" />;
    case 'payslip_generated':
      return <Receipt className="h-4 w-4 text-primary" />;
    case 'task_done':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'task_overdue':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function notificationBg(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-400/10';
    case 'payslip_generated':
      return 'bg-primary/10';
    case 'task_done':
      return 'bg-emerald-400/10';
    case 'task_overdue':
      return 'bg-destructive/10';
    default:
      return 'bg-muted';
  }
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted gap-2"
            onClick={handleMarkAllAsRead}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-muted rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BellOff className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You'll see activity here when things happen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'bg-card border-border transition-all cursor-pointer hover:border-border/80',
                !notification.read && 'border-l-2 border-l-primary'
              )}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', notificationBg(notification.type))}>
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
