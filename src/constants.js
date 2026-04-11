/**
 * constants.js
 * Single source of truth for magic strings used across the app.
 * Import from here instead of repeating raw string literals.
 */

export const ROLES = Object.freeze({
  MANAGER: 'manager',
  REFEREE: 'referee',
});

export const GAME_STATUS = Object.freeze({
  SCHEDULED:  'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
});

export const ASSIGNMENT_STATUS = Object.freeze({
  PENDING:   'pending',
  ASSIGNED:  'assigned',
  ACCEPTED:  'accepted',
  DECLINED:  'declined',
});

export const CONNECTION_STATUS = Object.freeze({
  PENDING:   'pending',
  CONNECTED: 'connected',
  DECLINED:  'declined',
});

export const NOTIFICATION_TYPES = Object.freeze({
  ASSIGNMENT: 'assignment',
  MESSAGE:    'message',
  PAYMENT:    'payment',
  SCHEDULE:   'schedule',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID:    'paid',
});
