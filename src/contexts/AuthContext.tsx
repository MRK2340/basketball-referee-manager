import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { checkAndSeedDemoData } from '@/lib/seedFirestore';
import { Analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { writeAuditLog } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

interface ProfileUpdates {
  name?: string;
  phone?: string;
  experience?: string;
  bio?: string;
  location?: string;
  [key: string]: string | undefined;
}

interface AuthContextValue {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  loading: boolean;
  createDemoAccounts: () => Promise<{ success: boolean }>;
  isAuthenticated: boolean;
  mfaResolver: MultiFactorResolver | null;
  verifyMFA: (code: string) => Promise<AppUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// S2 fix: whitelist allowed profile fields — module-level constant (not recreated per render)
const ALLOWED_PROFILE_FIELDS = new Set(['name', 'phone', 'experience', 'bio', 'location']);

const DEMO_ACCOUNTS: Record<string, Doc> = {
  'manager@demo.com': {
    name: 'Demo Manager',
    role: 'manager',
    phone: '+1 555 0100',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    location: 'Atlanta, GA',
    league_name: 'Metro AAU League',
    bio: 'Experienced tournament director running competitive AAU youth programs across the Southeast region.',
    certifications: ['Tournament Director'],
    games_officiated: 0,
    active_tournaments: 2,
    experience: '5 years',
    rating: 4.9,
  },
  'referee@demo.com': {
    name: 'Demo Referee',
    role: 'referee',
    phone: '+1 555 0200',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=referee',
    certifications: ['NFHS Certified', 'Certified Official Level 2'],
    games_officiated: 45,
    experience: '3 years',
    rating: 4.7,
    location: 'Atlanta, GA',
    bio: 'Dedicated official with experience across U12–U18 divisions.',
  },
};

const mapFirebaseError = (error: { code?: string; message?: string }) => {
  const codes: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  return new Error(codes[error.code] || error.message || 'An unexpected error occurred.');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const userRef = useRef<AppUser | null>(null);

  /** Only update state if the user data actually changed (prevents unnecessary re-renders). */
  const stableSetUser = (newUser: AppUser | null) => {
    const prev = userRef.current;
    if (prev === null && newUser === null) return;
    if (prev && newUser && prev.id === newUser.id && prev.name === newUser.name && prev.email === newUser.email && prev.role === newUser.role && prev.avatarUrl === newUser.avatarUrl && prev.rating === newUser.rating) return;
    userRef.current = newUser;
    setUser(newUser);
  };

  // Build app user object from Firebase UID + Firestore profile
  const buildUser = (uid: string, email: string | null, profile: Doc): AppUser => ({
    id: uid,
    email,
    ...profile,
    // Expose camelCase aliases so UI components don't need to know Firestore field names
    avatarUrl: profile.avatar_url || '',
    gamesOfficiated: profile.games_officiated || 0,
    leagueName: profile.league_name || '',
    activeTournaments: profile.active_tournaments || 0,
  } as AppUser);

  // Fetch or auto-create a Firestore user profile
  const getOrCreateProfile = async (uid: string, email: string | null): Promise<Doc | null> => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) return snap.data();

    // Auto-create for known demo accounts
    const demoDefaults = DEMO_ACCOUNTS[email?.toLowerCase()];
    if (demoDefaults) {
      const profile = { ...demoDefaults, email, created_at: new Date().toISOString() };
      await setDoc(userRef, profile);
      return profile;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Retry profile fetch once before giving up — handles transient network hiccups
        let profile = null;
        let lastErr = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            profile = await getOrCreateProfile(firebaseUser.uid, firebaseUser.email);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
          }
        }

        if (lastErr) {
          logger.error('Auth state profile fetch error (both attempts failed):', lastErr);
          toast({
            title: 'Could not load your profile',
            description: 'There was a problem loading your account. Please refresh the page to try again.',
            variant: 'destructive',
            duration: 10000,
            action: (
              <button
                onClick={() => window.location.reload()}
                className="text-xs underline font-medium"
              >
                Refresh now
              </button>
            ),
          });
          stableSetUser(null);
        } else if (profile) {
          stableSetUser(buildUser(firebaseUser.uid, firebaseUser.email, profile));
        } else {
          stableSetUser(null);
        }
      } else {
        stableSetUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AppUser> => {
    setLoading(true);
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const profile = await getOrCreateProfile(fbUser.uid, fbUser.email);
      if (!profile) throw new Error('User profile not found. Please register first.');

      const userData = buildUser(fbUser.uid, fbUser.email, profile);
      setUser(userData);

      // Trigger demo seed (no-op if already done or both users not yet registered)
      checkAndSeedDemoData().catch(e => logger.error('[Auth] Demo seed error:', e));
      Analytics.login();
      writeAuditLog(userData.id, 'login', 'auth');

      setLoading(false);
      return userData;
    } catch (error: unknown) {
      setLoading(false);
      // Handle MFA challenge
      const err = error as { code?: string };
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error as never);
        setMfaResolver(resolver);
        throw new Error('MFA_REQUIRED');
      }
      throw mapFirebaseError(error as { code?: string; message?: string });
    }
  };

  const verifyMFA = async (code: string): Promise<AppUser> => {
    if (!mfaResolver) throw new Error('No MFA challenge pending.');
    const hint = mfaResolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hint) throw new Error('No TOTP factor found. Contact support.');
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
    const { user: fbUser } = await mfaResolver.resolveSignIn(assertion);
    const profile = await getOrCreateProfile(fbUser.uid, fbUser.email);
    if (!profile) throw new Error('Profile not found.');
    const userData = buildUser(fbUser.uid, fbUser.email, profile);
    setUser(userData);
    setMfaResolver(null);
    writeAuditLog(userData.id, 'login_mfa', 'auth');
    return userData;
  };

  const register = async (userData: Doc) => {
    setLoading(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
        userData.email.trim().toLowerCase(),
        userData.password
      );

      const profile = {
        name: userData.name,
        email: userData.email.trim().toLowerCase(),
        role: userData.role || 'referee',
        phone: userData.phone || '',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        certifications: [],
        games_officiated: 0,
        experience: '0 years',
        rating: 0,
        bio: '',
        location: '',
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), profile);

      // Send email verification
      try { await sendEmailVerification(fbUser); } catch { /* best-effort */ }

      Analytics.signUp(userData.role || 'referee');
      toast({ title: 'Account created!', description: 'A verification email has been sent. You can now sign in.' });
      return { success: true };
    } catch (error) {
      const mapped = mapFirebaseError(error);
      toast({ title: 'Registration failed', description: mapped.message, variant: 'destructive' });
      return { success: false, error: mapped.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      toast({ title: 'Reset email sent', description: 'Check your inbox for password reset instructions.' });
      return { success: true };
    } catch (error) {
      const mapped = mapFirebaseError(error);
      toast({ title: 'Reset failed', description: mapped.message, variant: 'destructive' });
      return { success: false, error: mapped.message };
    }
  };

  const logout = async () => {
    setLoading(true);
    Analytics.logout();
    await signOut(auth);
    setUser(null);
    toast({ title: 'Logged out', description: 'See you next time!' });
    setLoading(false);
  };

  const updateProfile = async (updates: Doc) => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const safeUpdates = {};
      for (const key of Object.keys(updates)) {
        if (ALLOWED_PROFILE_FIELDS.has(key)) safeUpdates[key] = updates[key];
      }
      if (Object.keys(safeUpdates).length === 0) {
        toast({ title: 'No changes', description: 'Nothing to update.', variant: 'default' });
        setLoading(false);
        return;
      }
      await updateDoc(userRef, safeUpdates);
      setUser(prev => ({ ...prev!, ...safeUpdates }));
      Analytics.profileUpdated();
      writeAuditLog(user.id, 'update_profile', 'profile', Object.keys(safeUpdates).join(','));
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch (error) {
      toast({ title: 'Update failed', description: 'Could not save profile changes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please upload a photo under 5 MB.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Upload to Firebase Storage at avatars/{uid}/photo
      const fileRef = storageRef(storage, `avatars/${user.id}/photo`);
      await uploadBytes(fileRef, file);
      const avatarUrl = await getDownloadURL(fileRef);
      // Save the public download URL to Firestore (not a base64 blob)
      await updateDoc(doc(db, 'users', user.id), { avatar_url: avatarUrl });
      setUser(prev => ({ ...prev, avatar_url: avatarUrl, avatarUrl }));
      Analytics.photoUploaded();
      toast({ title: 'Profile photo updated!' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Kept for backward-compat with Login.jsx — now a no-op since accounts exist in Firebase
  const createDemoAccounts = async () => ({ success: true });

  const value: AuthContextValue = {
    user,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    uploadAvatar,
    loading,
    createDemoAccounts,
    isAuthenticated: !!user,
    mfaResolver,
    verifyMFA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
