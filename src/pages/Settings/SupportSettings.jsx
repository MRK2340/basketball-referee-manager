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
    <Card className="glass-effect border-slate-600">
      <CardHeader>
        <CardTitle className="text-white">Support & Help</CardTitle>
        <CardDescription className="text-slate-400">
          Get help and provide feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 border-slate-600 hover:bg-slate-800"
            onClick={() => onFeatureClick('help-center')}
          >
            <SettingsIcon className="h-6 w-6 text-blue-400" />
            <span className="text-sm">Help Center</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 border-slate-600 hover:bg-slate-800"
            onClick={() => onFeatureClick('contact-support')}
          >
            <MessageSquare className="h-6 w-6 text-green-400" />
            <span className="text-sm">Contact Support</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 border-slate-600 hover:bg-slate-800"
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