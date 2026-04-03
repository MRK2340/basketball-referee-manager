import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Mail,
  MessageSquare
} from 'lucide-react';

const SupportSettings = ({ onFeatureClick }) => {
  return (
    <Card className="glass-effect border-slate-200 shadow-sm" data-testid="settings-support-card">
      <CardHeader>
        <CardTitle className="text-slate-900">Support & Help</CardTitle>
        <CardDescription className="text-slate-600">
          Get help and provide feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            data-testid="settings-help-center-button"
            className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100"
            onClick={() => onFeatureClick('help-center')}
          >
            <SettingsIcon className="h-6 w-6 text-blue-400" />
            <span className="text-sm">Help Center</span>
          </Button>
          <Button 
            variant="outline" 
            data-testid="settings-contact-support-button"
            className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100"
            onClick={() => onFeatureClick('contact-support')}
          >
            <MessageSquare className="h-6 w-6 text-green-400" />
            <span className="text-sm">Contact Support</span>
          </Button>
          <Button 
            variant="outline" 
            data-testid="settings-send-feedback-button"
            className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100"
            onClick={() => onFeatureClick('send-feedback')}
          >
            <Mail className="h-6 w-6 text-purple-400" />
            <span className="text-sm">Send Feedback</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportSettings;