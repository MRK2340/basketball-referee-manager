import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const NotificationsSettings = ({ notifications, onNotificationChange, fcm }) => {
  const { pushEnabled = false, permissionStatus = 'default' } = fcm || {};

  const renderToggle = (key, checked, label) => (
    <button
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      onClick={() => onNotificationChange(key)}
      data-testid={`notifications-toggle-${key}`}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-orange' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <Card className="glass-effect border-slate-200 shadow-xs" data-testid="settings-notifications-card">
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
        {/* Game Notifications */}
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
                  {renderToggle(item.key, notifications[item.key], item.label)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Communication */}
        <div>
          <h4 className="text-slate-900 font-bold mb-3">Communication</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">New messages</span>
              </div>
              {renderToggle('messages', notifications.messages, 'New messages')}
            </div>
          </div>
        </div>

        {/* Delivery Methods */}
        <div>
          <h4 className="text-slate-900 font-bold mb-3">Delivery Methods</h4>
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">Email notifications</span>
              </div>
              {renderToggle('emailNotifications', notifications.emailNotifications, 'Email notifications')}
            </div>

            {/* Push Notifications — shows real FCM status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-slate-700 font-medium">Push notifications</span>
                    {pushEnabled && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={!!notifications.pushNotifications}
                  aria-label="Push notifications"
                  onClick={() => onNotificationChange('pushNotifications')}
                  data-testid="notifications-toggle-pushNotifications"
                  disabled={permissionStatus === 'denied'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    notifications.pushNotifications ? 'bg-brand-orange' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Warning if browser has blocked notifications */}
              {permissionStatus === 'denied' && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Notifications are blocked in your browser. Click the lock icon in your address bar and allow notifications to re-enable.
                  </span>
                </div>
              )}
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">SMS notifications</span>
              </div>
              {renderToggle('smsNotifications', notifications.smsNotifications, 'SMS notifications')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettings;