import React from 'react';
import { useNavigate } from 'react-router';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  MessageSquare,
  ClipboardList,
  DollarSign,
  Trophy,
  FileText,
  CheckCheck,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  message:      { icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Message' },
  assignment:   { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Assignment' },
  payment:      { icon: DollarSign,    color: 'text-green-600',  bg: 'bg-green-50',  label: 'Payment' },
  game_request: { icon: Trophy,        color: 'text-purple-600', bg: 'bg-purple-50', label: 'Game Request' },
  report:       { icon: FileText,      color: 'text-slate-600',  bg: 'bg-slate-100', label: 'Report' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NotificationItem = ({ notification, onRead }: { notification: any; onRead: (id: string) => void }) => {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.message;
  const Icon = cfg.icon;

  const handleClick = () => {
    onRead(notification.id);
    navigate(notification.link || '/');
  };

  return (
    <button
      data-testid={`notification-item-${notification.id}`}
      onClick={handleClick}
      className={`w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 flex items-start gap-3 ${
        !notification.read ? 'bg-blue-50/40' : ''
      }`}
    >
      <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm font-semibold truncate ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-brand-orange" />
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mb-1">{notification.body}</p>
        <p className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
};

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationPanel = ({ open, onOpenChange }: NotificationPanelProps) => {
  const { notifications, notificationActions } = useData();
  const { markNotificationRead, markAllNotificationsRead } = notificationActions;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-96 p-0 flex flex-col bg-white"
        data-testid="notification-panel"
      >
        <SheetHeader className="px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-slate-900 text-lg font-bold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge
                  data-testid="notification-panel-unread-badge"
                  className="basketball-gradient text-white border-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                data-testid="notification-mark-all-read-button"
                onClick={markAllNotificationsRead}
                className="text-xs text-brand-blue hover:text-brand-blue hover:bg-blue-50 h-8 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto" data-testid="notification-list">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-slate-400 text-sm mt-1">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onRead={markNotificationRead}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;
