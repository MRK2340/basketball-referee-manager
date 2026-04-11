import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  Settings as SettingsIcon
} from 'lucide-react';

const NotificationsSettings = ({ notifications, onNotificationChange }) => {
  return (
    <Card className="glass-effect border-slate-200 shadow-sm" data-testid="settings-notifications-card">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center space-x-2">
          <Bell className="h-5 w-5 text-brand-blue" />
          <span>Notifications</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-slate-900 font-bold mb-3">Game Notifications</h4>
          <div className="space-y-3">
            {[
              { key: 'gameAssignments', label: 'New game assignments', icon: SettingsIcon },
              { key: 'scheduleChanges', label: 'Schedule changes', icon: SettingsIcon },
              { key: 'paymentUpdates', label: 'Payment updates', icon: CreditCard }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={!!notifications[item.key]}
                    aria-label={item.label}
                    onClick={() => onNotificationChange(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-brand-orange' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Communication</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">New messages</span>
              </div>
              <button
                role="switch"
                aria-checked={!!notifications.messages}
                aria-label="New messages"
                onClick={() => onNotificationChange('messages')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.messages ? 'bg-brand-orange' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    notifications.messages ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Delivery Methods</h4>
          <div className="space-y-3">
            {[
              { key: 'emailNotifications', label: 'Email notifications', icon: Mail },
              { key: 'pushNotifications', label: 'Push notifications', icon: Smartphone },
              { key: 'smsNotifications', label: 'SMS notifications', icon: MessageSquare }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={!!notifications[item.key]}
                    aria-label={item.label}
                    onClick={() => onNotificationChange(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-brand-orange' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettings;