import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Smartphone,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';

const AccountSecuritySettings = ({ onFeatureClick }) => {
  return (
    <Card className="glass-effect border-slate-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-400" />
          <span>Account & Security</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Manage your account security and data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Security Settings</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => onFeatureClick('change-password')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => onFeatureClick('two-factor-auth')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => onFeatureClick('login-history')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Login History
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold">Data Management</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => onFeatureClick('export-data')}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => onFeatureClick('privacy-settings')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-red-600 text-red-400 hover:bg-red-900/20"
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