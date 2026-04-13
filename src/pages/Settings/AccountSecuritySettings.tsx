import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Smartphone,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';

const AccountSecuritySettings = ({ onFeatureClick }: { onFeatureClick: (feature: string) => void }) => {
  return (
    <Card className="glass-effect border-slate-200 shadow-xs" data-testid="settings-account-security-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-900">
          <Shield className="h-5 w-5 text-red-500" />
          <span>Account & Security</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Manage your account security and data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Security Settings</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                data-testid="settings-change-password-button"
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => onFeatureClick('change-password')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                data-testid="settings-two-factor-button"
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => onFeatureClick('two-factor-auth')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>
              <Button 
                variant="outline" 
                data-testid="settings-login-history-button"
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => onFeatureClick('login-history')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Login History
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Data Management</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                data-testid="settings-export-data-button"
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => onFeatureClick('export-data')}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
              <Button 
                variant="outline" 
                data-testid="settings-privacy-settings-button"
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => onFeatureClick('privacy-settings')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
              <Button 
                variant="outline" 
                data-testid="settings-delete-account-button"
                className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => onFeatureClick('delete-account')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSecuritySettings;