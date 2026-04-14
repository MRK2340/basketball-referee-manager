import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance, type FirebasePerformance } from 'firebase/performance';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getRemoteConfig, fetchAndActivate, getValue, type RemoteConfig } from 'firebase/remote-config';

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

// ── App Check — protects Firestore/Storage/Functions from abuse ─────────────
// reCAPTCHA v3 runs invisibly (no user interaction). Debug token for dev.
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;
if (RECAPTCHA_SITE_KEY) {
  try {
    // Enable debug token in development (prints to console, register in Firebase Console)
    if (import.meta.env.DEV) {
      (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    console.warn('[iWhistle] App Check initialization failed — running without protection');
  }
}

// ── Remote Config — feature flags toggled from Firebase Console ──────────────
let _remoteConfig: RemoteConfig | null = null;
try {
  _remoteConfig = getRemoteConfig(app);
  _remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 30000 : 3600000;
  _remoteConfig.defaultConfig = {
    maintenance_mode: false,
    maintenance_message: 'iWhistle is undergoing scheduled maintenance. Please check back shortly.',
    feature_ai_assistant: true,
    feature_bracket_editor: true,
    feature_schedule_import: true,
    feature_push_notifications: true,
    announcement_banner: '',
    announcement_banner_color: '#0080C8',
  };
} catch {
  console.warn('[iWhistle] Remote Config initialization failed');
}
export const remoteConfig = _remoteConfig;

/** Fetch and activate remote config. Call once on app mount. */
export const loadRemoteConfig = async (): Promise<Record<string, string | boolean>> => {
  if (!_remoteConfig) return {};
  try {
    await fetchAndActivate(_remoteConfig);
    return {
      maintenanceMode: getValue(_remoteConfig, 'maintenance_mode').asBoolean(),
      maintenanceMessage: getValue(_remoteConfig, 'maintenance_message').asString(),
      featureAiAssistant: getValue(_remoteConfig, 'feature_ai_assistant').asBoolean(),
      featureBracketEditor: getValue(_remoteConfig, 'feature_bracket_editor').asBoolean(),
      featureScheduleImport: getValue(_remoteConfig, 'feature_schedule_import').asBoolean(),
      featurePushNotifications: getValue(_remoteConfig, 'feature_push_notifications').asBoolean(),
      announcementBanner: getValue(_remoteConfig, 'announcement_banner').asString(),
      announcementBannerColor: getValue(_remoteConfig, 'announcement_banner_color').asString(),
    };
  } catch {
    return {};
  }
};

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
