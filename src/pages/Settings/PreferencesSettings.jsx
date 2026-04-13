import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Settings as SettingsIcon, 
  Globe,
  Moon,
  Sun,
  Volume2
} from 'lucide-react';

const PreferencesSettings = ({ preferences, onPreferenceChange }) => {
  return (
    <Card className="glass-effect border-slate-200 shadow-xs" data-testid="settings-preferences-card">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-green-600" />
          <span>App Preferences</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Customize your app experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-slate-900 font-bold mb-3">Appearance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                {preferences.darkMode ? (
                  <Moon className="h-4 w-4 text-slate-500" />
                ) : (
                  <Sun className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-slate-700 font-medium">Dark mode</span>
              </div>
              <button
                onClick={() => onPreferenceChange('darkMode', !preferences.darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.darkMode ? 'bg-brand-orange' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Volume2 className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">Sound effects</span>
              </div>
              <button
                onClick={() => onPreferenceChange('soundEffects', !preferences.soundEffects)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.soundEffects ? 'bg-brand-orange' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    preferences.soundEffects ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Language & Region</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-800 font-medium">Language</Label>
              <select 
                value={preferences.language}
                onChange={(e) => onPreferenceChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-blue font-medium"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-800 font-medium">Timezone</Label>
              <select 
                value={preferences.timezone}
                onChange={(e) => onPreferenceChange('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-blue font-medium"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Data & Sync</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700 font-medium">Auto-refresh data</span>
              </div>
              <button
                onClick={() => onPreferenceChange('autoRefresh', !preferences.autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.autoRefresh ? 'bg-brand-orange' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    preferences.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesSettings;