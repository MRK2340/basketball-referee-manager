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
  | { error: { message: string }; data?: undefined };

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
