/**
 * constants.test.js
 * Verifies the shape and values of all exported enums in src/constants.js
 */
import { describe, it, expect } from 'vitest';
import {
  ROLES,
  GAME_STATUS,
  ASSIGNMENT_STATUS,
  CONNECTION_STATUS,
  NOTIFICATION_TYPES,
  PAYMENT_STATUS,
} from '../constants';

describe('ROLES', () => {
  it('has manager and referee keys', () => {
    expect(ROLES.MANAGER).toBe('manager');
    expect(ROLES.REFEREE).toBe('referee');
  });
  it('is frozen', () => {
    expect(Object.isFrozen(ROLES)).toBe(true);
  });
});

describe('GAME_STATUS', () => {
  it('has the four expected statuses', () => {
    expect(GAME_STATUS.SCHEDULED).toBe('scheduled');
    expect(GAME_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(GAME_STATUS.COMPLETED).toBe('completed');
    expect(GAME_STATUS.CANCELLED).toBe('cancelled');
  });
  it('is frozen', () => expect(Object.isFrozen(GAME_STATUS)).toBe(true));
});

describe('ASSIGNMENT_STATUS', () => {
  it('has the four expected statuses', () => {
    expect(ASSIGNMENT_STATUS.PENDING).toBe('pending');
    expect(ASSIGNMENT_STATUS.ASSIGNED).toBe('assigned');
    expect(ASSIGNMENT_STATUS.ACCEPTED).toBe('accepted');
    expect(ASSIGNMENT_STATUS.DECLINED).toBe('declined');
  });
  it('is frozen', () => expect(Object.isFrozen(ASSIGNMENT_STATUS)).toBe(true));
});

describe('CONNECTION_STATUS', () => {
  it('has the three expected statuses', () => {
    expect(CONNECTION_STATUS.PENDING).toBe('pending');
    expect(CONNECTION_STATUS.CONNECTED).toBe('connected');
    expect(CONNECTION_STATUS.DECLINED).toBe('declined');
  });
  it('is frozen', () => expect(Object.isFrozen(CONNECTION_STATUS)).toBe(true));
});

describe('NOTIFICATION_TYPES', () => {
  it('has the four expected types', () => {
    expect(NOTIFICATION_TYPES.ASSIGNMENT).toBe('assignment');
    expect(NOTIFICATION_TYPES.MESSAGE).toBe('message');
    expect(NOTIFICATION_TYPES.PAYMENT).toBe('payment');
    expect(NOTIFICATION_TYPES.SCHEDULE).toBe('schedule');
  });
  it('is frozen', () => expect(Object.isFrozen(NOTIFICATION_TYPES)).toBe(true));
});

describe('PAYMENT_STATUS', () => {
  it('has pending and paid', () => {
    expect(PAYMENT_STATUS.PENDING).toBe('pending');
    expect(PAYMENT_STATUS.PAID).toBe('paid');
  });
  it('is frozen', () => expect(Object.isFrozen(PAYMENT_STATUS)).toBe(true));
});
