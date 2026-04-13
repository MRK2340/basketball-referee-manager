import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { writeAuditLog } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface TwoFactorDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  user: AppUser;
}

type Step = 'password' | 'qrcode' | 'verify' | 'done';

const TwoFactorDialog = ({ open, setOpen, user }: TwoFactorDialogProps) => {
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [totpSecret, setTotpSecret] = useState<any>(null);

  const handleReauth = async () => {
    setLoading(true);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser || !fbUser.email) throw new Error('No authenticated user.');
      const cred = EmailAuthProvider.credential(fbUser.email, password);
      await reauthenticateWithCredential(fbUser, cred);

      // Generate TOTP secret
      const session = await multiFactor(fbUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      setTotpSecret(secret);
      setQrUrl(secret.generateQrCodeUrl(user.email || 'iWhistle', 'iWhistle'));
      setSecretKey(secret.secretKey);
      setStep('qrcode');
    } catch (err: unknown) {
      const msg = (err as { code?: string }).code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : (err as Error).message || 'Re-authentication failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast({ title: 'Enter 6-digit code', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser || !totpSecret) throw new Error('Session expired.');
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, verifyCode);
      await multiFactor(fbUser).enroll(assertion, 'Authenticator App');
      writeAuditLog(user.id, 'enable_2fa', 'auth');
      setStep('done');
    } catch (err: unknown) {
      toast({ title: 'Verification failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('password');
    setPassword('');
    setQrUrl('');
    setSecretKey('');
    setVerifyCode('');
    setTotpSecret(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="two-factor-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0080C8]" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === 'password' && 'Confirm your password to set up 2FA.'}
            {step === 'qrcode' && 'Scan this QR code with your authenticator app.'}
            {step === 'verify' && 'Enter the 6-digit code from your authenticator app.'}
            {step === 'done' && '2FA has been enabled on your account.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'password' && (
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                data-testid="two-factor-password-input"
                onKeyDown={e => e.key === 'Enter' && handleReauth()}
              />
            </div>
            <Button onClick={handleReauth} disabled={loading || !password} className="w-full" data-testid="two-factor-continue-button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue
            </Button>
          </div>
        )}

        {step === 'qrcode' && (
          <div className="space-y-4 text-center">
            {qrUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="2FA QR Code"
                className="mx-auto rounded-lg border"
                data-testid="two-factor-qr-code"
              />
            )}
            <div className="text-xs text-gray-500">
              Can't scan? Enter this key manually:
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all select-all">{secretKey}</code>
            </div>
            <Button onClick={() => setStep('verify')} className="w-full" data-testid="two-factor-next-button">
              Next — Enter Verification Code
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <Label>6-digit code</Label>
              <Input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                data-testid="two-factor-code-input"
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="w-full" data-testid="two-factor-verify-button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enable 2FA
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-semibold">Two-Factor Authentication Enabled</p>
            <p className="text-sm text-gray-500">Your account is now protected with an authenticator app.</p>
            <Button onClick={handleClose} className="w-full" data-testid="two-factor-done-button">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorDialog;
