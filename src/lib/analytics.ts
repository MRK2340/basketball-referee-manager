/**
 * analytics.js
 * Thin wrapper around Firebase Analytics.
 * Import { Analytics } anywhere to log named events without littering
 * raw logEvent() calls across the codebase.
 */
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

const track = (name, params = {}) => {
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch {
    // Silently fail — analytics should never break the app
  }
};

export const Analytics = {
  // Auth
  login:        ()           => track('login',                    { method: 'email' }),
  signUp:       (role)       => track('sign_up',                  { method: 'email', role }),
  logout:       ()           => track('logout'),

  // Profile
  photoUploaded: ()          => track('profile_photo_uploaded'),
  profileUpdated: ()         => track('profile_updated'),

  // Notifications
  pushEnabled:  ()           => track('push_notifications_enabled'),
  pushDisabled: ()           => track('push_notifications_disabled'),

  // Messaging
  messageSent:  ()           => track('message_sent'),

  // Games
  gameReportSubmitted: ()    => track('game_report_submitted'),
  independentGameLogged: ()  => track('independent_game_logged'),

  // Exports
  exportGenerated: (format)  => track('export_generated', { format }),

  // Page views (called by RouteTracker component)
  pageView: (path, title)    => track('page_view', { page_path: path, page_title: title }),
};
