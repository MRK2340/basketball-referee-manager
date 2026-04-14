/**
 * types.ts
 * Shared TypeScript types for the iWhistle app.
 */
import type { MappedProfile } from './mappers';
import type { Role } from '../constants';

/** The authenticated user object stored in AuthContext */
export interface AppUser extends MappedProfile {
  id: string;
  email: string;
  role: Role;
  avatar_url?: string;
  league_name?: string;
  active_tournaments?: number;
  games_officiated?: number;
  notification_preferences?: NotificationPreferences;
  fcmToken?: string | null;
}

/** Result of safeHandle — either data or error, never both */
export type SafeResult<T = true> =
  | { data: T; error?: undefined }
  | { error: FirestoreError; data?: undefined };

/** Structured error returned by safeHandle — preserves code for conditional retry */
export interface FirestoreError {
  message: string;
  code: string;
  retryable: boolean;
}

/** Notification preference settings */
export interface NotificationPreferences {
  gameAssignments: boolean;
  scheduleChanges: boolean;
  paymentUpdates: boolean;
  messages: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  [key: string]: boolean;
}

/** Minimal user shape required by firestoreService functions */
export interface ServiceUser {
  id: string;
  name: string;
  role: string;
  email?: string;
}
