/**
 * constants.ts
 * Frozen enum-like objects for role names, status labels, etc.
 * Imported by mappers, hooks, and UI components.
 */

export const ROLES = Object.freeze({
  MANAGER: 'manager',
  REFEREE: 'referee',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const GAME_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const);

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

export const ASSIGNMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  REQUESTED: 'requested',
} as const);

export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export const CONNECTION_STATUS = Object.freeze({
  PENDING: 'pending',
  CONNECTED: 'connected',
  DECLINED: 'declined',
} as const);

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export const NOTIFICATION_TYPES = Object.freeze({
  ASSIGNMENT: 'assignment',
  MESSAGE: 'message',
  PAYMENT: 'payment',
  SCHEDULE: 'schedule',
} as const);

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
} as const);

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
