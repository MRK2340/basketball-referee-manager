import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const DEMO_ACCOUNTS = {
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

const mapFirebaseError = (error) => {
  const codes = {
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build app user object from Firebase UID + Firestore profile
  const buildUser = (uid, email, profile) => ({
    id: uid,
    email,
    ...profile,
    // Expose camelCase aliases so UI components don't need to know Firestore field names
    avatarUrl: profile.avatar_url || '',
    gamesOfficiated: profile.games_officiated || 0,
    leagueName: profile.league_name || '',
    activeTournaments: profile.active_tournaments || 0,
  });

  // Fetch or auto-create a Firestore user profile
  const getOrCreateProfile = async (uid, email) => {
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
        try {
          const profile = await getOrCreateProfile(firebaseUser.uid, firebaseUser.email);
          if (profile) {
            setUser(buildUser(firebaseUser.uid, firebaseUser.email, profile));
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Auth state profile fetch error:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const profile = await getOrCreateProfile(fbUser.uid, fbUser.email);
      if (!profile) throw new Error('User profile not found. Please register first.');

      const userData = buildUser(fbUser.uid, fbUser.email, profile);
      setUser(userData);

      // Trigger demo seed (no-op if already done or both users not yet registered)
      checkAndSeedDemoData().catch(console.error);

      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      throw mapFirebaseError(error);
    }
  };

  const register = async (userData) => {
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

      toast({ title: 'Account created!', description: 'You can now sign in.' });
      return { success: true };
    } catch (error) {
      const mapped = mapFirebaseError(error);
      toast({ title: 'Registration failed', description: mapped.message, variant: 'destructive' });
      return { success: false, error: mapped.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    toast({ title: 'Logged out', description: 'See you next time!' });
    setLoading(false);
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      // Never write password or id to Firestore
      const { password, id, ...safeUpdates } = updates;
      await updateDoc(userRef, safeUpdates);
      setUser(prev => ({ ...prev, ...safeUpdates }));
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch (error) {
      toast({ title: 'Update failed', description: 'Could not save profile changes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
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
      toast({ title: 'Profile photo updated!' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Kept for backward-compat with Login.jsx — now a no-op since accounts exist in Firebase
  const createDemoAccounts = async () => ({ success: true });

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    loading,
    createDemoAccounts,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
