import React, { useState, useEffect } from 'react';
import { Building2, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { fetchPaymentInfo, savePaymentInfo } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface DirectDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser;
}

export const DirectDepositDialog: React.FC<DirectDepositDialogProps> = ({ open, onOpenChange, user }) => {
  const [bankName, setBankName]       = useState('');
  const [routing, setRouting]         = useState('');
  const [account, setAccount]         = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [loading, setLoading]         = useState(false);
  const [saved, setSaved]             = useState(false);

  // Pre-fill existing info
  useEffect(() => {
    if (!open) return;
    fetchPaymentInfo(user.id).then(result => {
      if (result.data) {
        setBankName(result.data.bankName);
        setAccountType(result.data.accountType);
        // Don't pre-fill routing/account — they're masked
      }
    });
  }, [open, user.id]);

  const handleSave = async () => {
    if (!bankName.trim()) {
      toast({ title: 'Bank name required', variant: 'destructive' });
      return;
    }
    if (routing && routing.length !== 9) {
      toast({ title: 'Routing number must be 9 digits', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const result = await savePaymentInfo(user.id, {
      preferredMethod: 'direct_deposit',
      bankName: bankName.trim(),
      routingLast4: routing.slice(-4),
      accountLast4: account.slice(-4),
      accountType,
    });
    setLoading(false);
    if (result.error) {
      toast({ title: 'Could not save', description: result.error.message, variant: 'destructive' });
      return;
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
    }, 1200);
    toast({ title: 'Direct deposit saved', description: 'Your bank information has been securely stored.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="direct-deposit-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building2 className="h-5 w-5 text-brand-blue" />
            Direct Deposit Setup
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Add your bank account to receive payment directly. Only the last 4 digits are stored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700">Bank Name</Label>
            <Input
              data-testid="direct-deposit-bank-name"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="e.g. Chase, Bank of America"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700">Routing Number <span className="text-slate-400">(9 digits)</span></Label>
            <Input
              data-testid="direct-deposit-routing"
              value={routing}
              onChange={e => setRouting(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="123456789"
              type="text"
              inputMode="numeric"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700">Account Number</Label>
            <Input
              data-testid="direct-deposit-account"
              value={account}
              onChange={e => setAccount(e.target.value.replace(/\D/g, '').slice(0, 17))}
              placeholder="Your account number"
              type="text"
              inputMode="numeric"
              className="border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger data-testid="direct-deposit-account-type" className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Lock className="h-4 w-4 text-brand-blue flex-shrink-0" />
            <p className="text-xs text-slate-600">
              Only the last 4 digits of your routing and account numbers are stored. Full numbers are never saved.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Cancel
          </Button>
          <Button
            data-testid="direct-deposit-save-button"
            onClick={handleSave}
            disabled={loading || saved}
            className="basketball-gradient hover:opacity-90 text-white"
          >
            {saved ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Saved!</>
            ) : loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
            ) : (
              'Save Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
