import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance, type FirebasePerformance } from 'firebase/performance';

// C2 — Startup validation: fail fast with a clear error if any Firebase config is missing.
// This prevents silent failures where the app loads but all Firebase calls 404.
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
const missingVars = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key]);
if (missingVars.length > 0) {
  throw new Error(
    `[firebase.js] Missing required environment variables:\n  ${missingVars.join('\n  ')}\n` +
    `Copy .env.example to .env and fill in your Firebase project values.`
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'refereemanager');
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Offline-first: enable IndexedDB persistence for Firestore
// Export status so the UI can inform the user if offline mode is unavailable
export type PersistenceStatus = 'enabled' | 'multi-tab' | 'unsupported' | 'error';
let _persistenceStatus: PersistenceStatus = 'enabled';
const _persistenceReady = enableIndexedDbPersistence(db)
  .then(() => { _persistenceStatus = 'enabled'; })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      _persistenceStatus = 'multi-tab';
      console.warn('[iWhistle] Firestore persistence unavailable: multiple tabs open. Data will still work but won\'t be cached offline in this tab.');
    } else if (err.code === 'unimplemented') {
      _persistenceStatus = 'unsupported';
      console.warn('[iWhistle] Firestore persistence unavailable: browser does not support IndexedDB. Offline mode disabled.');
    } else {
      _persistenceStatus = 'error';
      console.warn('[iWhistle] Firestore persistence failed:', err.code || err.message);
    }
  });

/** Returns the IndexedDB persistence status after initialization completes. */
export const getPersistenceStatus = async (): Promise<PersistenceStatus> => {
  await _persistenceReady;
  return _persistenceStatus;
};

// Firebase Performance Monitoring — auto-collects page load, network requests, route changes
let perf: FirebasePerformance | null = null;
try {
  perf = getPerformance(app);
} catch {
  // Performance SDK may fail in non-browser environments (SSR, tests)
}
export const performance = perf;

export default app;
