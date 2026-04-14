import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

interface PrivacyPrefs {
  profilePublic: boolean;
  showEmail: boolean;
  showRating: boolean;
  showAvailability: boolean;
}

const DEFAULTS: PrivacyPrefs = {
  profilePublic: true,
  showEmail: false,
  showRating: true,
  showAvailability: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacySettingsDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PrivacyPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'users', user.id));
        if (snap.exists()) {
          const data = snap.data();
          setPrefs({
            profilePublic: data.privacy_profile_public ?? DEFAULTS.profilePublic,
            showEmail: data.privacy_show_email ?? DEFAULTS.showEmail,
            showRating: data.privacy_show_rating ?? DEFAULTS.showRating,
            showAvailability: data.privacy_show_availability ?? DEFAULTS.showAvailability,
          });
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        privacy_profile_public: prefs.profilePublic,
        privacy_show_email: prefs.showEmail,
        privacy_show_rating: prefs.showRating,
        privacy_show_availability: prefs.showAvailability,
      });
      toast({ title: 'Privacy settings saved' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggle = (key: keyof PrivacyPrefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900" data-testid="privacy-settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-blue" /> Privacy Settings
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Control what others can see about you.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between" data-testid="privacy-toggle-profile-public">
              <div>
                <Label className="text-sm font-medium text-slate-800">Public Profile</Label>
                <p className="text-xs text-slate-500">Allow others to view your referee profile page</p>
              </div>
              <Switch checked={prefs.profilePublic} onCheckedChange={() => toggle('profilePublic')} />
            </div>

            <div className="flex items-center justify-between" data-testid="privacy-toggle-show-email">
              <div>
                <Label className="text-sm font-medium text-slate-800">Show Email</Label>
                <p className="text-xs text-slate-500">Display your email on your public profile</p>
              </div>
              <Switch checked={prefs.showEmail} onCheckedChange={() => toggle('showEmail')} />
            </div>

            <div className="flex items-center justify-between" data-testid="privacy-toggle-show-rating">
              <div>
                <Label className="text-sm font-medium text-slate-800">Show Rating</Label>
                <p className="text-xs text-slate-500">Display your referee rating publicly</p>
              </div>
              <Switch checked={prefs.showRating} onCheckedChange={() => toggle('showRating')} />
            </div>

            <div className="flex items-center justify-between" data-testid="privacy-toggle-show-availability">
              <div>
                <Label className="text-sm font-medium text-slate-800">Show Availability</Label>
                <p className="text-xs text-slate-500">Let managers see your availability calendar</p>
              </div>
              <Switch checked={prefs.showAvailability} onCheckedChange={() => toggle('showAvailability')} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading} className="basketball-gradient text-white hover:opacity-90" data-testid="privacy-settings-save-btn">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
