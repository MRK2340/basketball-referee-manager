import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { fetchPaymentInfo, savePaymentInfo } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface PaymentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser;
}

const METHODS = [
  { value: 'check',          label: 'Check' },
  { value: 'venmo',          label: 'Venmo' },
  { value: 'zelle',          label: 'Zelle' },
  { value: 'paypal',         label: 'PayPal' },
  { value: 'direct_deposit', label: 'Direct Deposit' },
];

export const PaymentSettingsDialog: React.FC<PaymentSettingsDialogProps> = ({ open, onOpenChange, user }) => {
  const [method, setMethod]     = useState('check');
  const [venmo, setVenmo]       = useState('');
  const [zelle, setZelle]       = useState('');
  const [paypal, setPaypal]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchPaymentInfo(user.id).then(result => {
      if (result.data) {
        setMethod(result.data.preferredMethod || 'check');
        setVenmo(result.data.venmoHandle);
        setZelle(result.data.zellePhone);
        setPaypal(result.data.paypalEmail);
      }
    });
  }, [open, user.id]);

  const handleSave = async () => {
    setLoading(true);
    const result = await savePaymentInfo(user.id, {
      preferredMethod: method,
      venmoHandle: venmo.trim(),
      zellePhone: zelle.trim(),
      paypalEmail: paypal.trim(),
    });
    setLoading(false);
    if (result.error) {
      toast({ title: 'Could not save', description: result.error.message, variant: 'destructive' });
      return;
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onOpenChange(false); }, 1200);
    toast({ title: 'Payment settings saved', description: 'Your preferred payment method has been updated.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="payment-settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5 text-brand-blue" />
            Payment Settings
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Set your preferred payment method so managers know how to pay you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700">Preferred Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger data-testid="payment-method-select" className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {method === 'venmo' && (
            <div className="space-y-1.5">
              <Label className="text-slate-700">Venmo Handle</Label>
              <Input
                data-testid="payment-venmo-input"
                value={venmo}
                onChange={e => setVenmo(e.target.value)}
                placeholder="@username"
                className="border-slate-300"
              />
            </div>
          )}

          {method === 'zelle' && (
            <div className="space-y-1.5">
              <Label className="text-slate-700">Zelle Phone or Email</Label>
              <Input
                data-testid="payment-zelle-input"
                value={zelle}
                onChange={e => setZelle(e.target.value)}
                placeholder="Phone number or email"
                className="border-slate-300"
              />
            </div>
          )}

          {method === 'paypal' && (
            <div className="space-y-1.5">
              <Label className="text-slate-700">PayPal Email</Label>
              <Input
                data-testid="payment-paypal-input"
                value={paypal}
                onChange={e => setPaypal(e.target.value)}
                placeholder="paypal@example.com"
                type="email"
                className="border-slate-300"
              />
            </div>
          )}

          {method === 'direct_deposit' && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-slate-700 font-medium">Direct Deposit selected</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the "Setup Direct Deposit" button below the payments list to add your bank details.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Cancel
          </Button>
          <Button
            data-testid="payment-settings-save-button"
            onClick={handleSave}
            disabled={loading || saved}
            className="basketball-gradient hover:opacity-90 text-white"
          >
            {saved ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Saved!</>
            ) : loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
