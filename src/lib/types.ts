/**
 * types.ts
 * Shared TypeScript types for the iWhistle app.
 */
import type {
  MappedProfile, MappedGame, MappedTournament, MappedPayment,
  MappedMessage, MappedAvailability, MappedGameReport, MappedConnection,
} from './mappers';
import type { Role } from '../constants';
import type { LucideIcon } from 'lucide-react';

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
  avatarUrl?: string;
}

/** Raw Firestore notification document */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  created_at: string;
  recipient_id: string;
}

/** Referee rating record */
export interface RefereeRating {
  id: string;
  game_id: string;
  referee_id: string;
  manager_id: string;
  stars: number;
  feedback: string;
  created_at: string;
}

/** Independent game record */
export interface IndependentGame {
  id: string;
  referee_id: string;
  date: string;
  time: string;
  location: string;
  organization: string;
  game_type: string;
  fee: number;
  notes: string;
  created_at: string;
}

/** Referee with availability data (as returned from fetchAppData) */
export interface RefereeWithAvailability extends MappedProfile {
  availability: MappedAvailability[];
}

/** Shape of the full data returned by fetchAppData */
export interface AppData {
  games: MappedGame[];
  payments: MappedPayment[];
  messages: MappedMessage[];
  notifications: AppNotification[];
  tournaments: MappedTournament[];
  referees: RefereeWithAvailability[];
  availability: MappedAvailability[];
  gameReports: MappedGameReport[];
  refereeRatings: RefereeRating[];
  notificationPreferences: NotificationPreferences;
  connections: MappedConnection[];
  managerProfiles: MappedProfile[];
  independentGames: IndependentGame[];
  hasMoreGames: boolean;
  hasMoreTournaments: boolean;
  hasMoreMessages: boolean;
  hasMoreNotifications: boolean;
}

/** DataContext value shape */
export interface DataContextValue {
  loading: boolean;
  refreshing: boolean;
  games: MappedGame[];
  payments: MappedPayment[];
  messages: MappedMessage[];
  notifications: AppNotification[];
  tournaments: MappedTournament[];
  referees: RefereeWithAvailability[];
  availability: MappedAvailability[];
  gameReports: MappedGameReport[];
  refereeRatings: RefereeRating[];
  notificationPreferences: NotificationPreferences;
  connections: MappedConnection[];
  managerProfiles: MappedProfile[];
  independentGames: IndependentGame[];
  hasMoreMessages: boolean;
  hasMoreGames: boolean;
  hasMoreTournaments: boolean;
  hasMoreNotifications: boolean;
  loadMoreMessages: (msgs: MappedMessage[], refs: MappedProfile[], mgrs: MappedProfile[]) => Promise<void>;
  loadMoreGames: () => Promise<void>;
  loadMoreTournaments: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  fetchData: (isInitial?: boolean) => Promise<void>;
  tournamentActions: Record<string, (...args: unknown[]) => Promise<void>>;
  gameActions: Record<string, (...args: unknown[]) => Promise<void>>;
  assignmentActions: Record<string, (...args: unknown[]) => Promise<void>>;
  messageActions: Record<string, (...args: unknown[]) => Promise<void>>;
  availabilityActions: Record<string, (...args: unknown[]) => Promise<void>>;
  reportActions: Record<string, (...args: unknown[]) => Promise<void>>;
  notificationActions: Record<string, (...args: unknown[]) => Promise<void>>;
  paymentActions: Record<string, (...args: unknown[]) => Promise<void>>;
  connectionActions: Record<string, (...args: unknown[]) => Promise<void>>;
  settingsActions: Record<string, (...args: unknown[]) => Promise<void>>;
  independentGameActions: Record<string, (...args: unknown[]) => Promise<void>>;
}

/** Props for icon-based components (LucideIcon type) */
export type IconComponent = LucideIcon;
