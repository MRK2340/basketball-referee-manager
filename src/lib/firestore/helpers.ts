/**
 * firestore/helpers.ts
 * Shared utilities for all Firestore service modules.
 */
import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, documentId, serverTimestamp, writeBatch,
  type DocumentSnapshot, type QuerySnapshot,
} from 'firebase/firestore';
import { logger } from '../logger';
import { toISOString } from '../timestampUtils';
import type { SafeResult, ServiceUser } from '../types';

// Re-export for consumer modules
export { db };
export {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, documentId, serverTimestamp, writeBatch,
};
export type { DocumentSnapshot, QuerySnapshot, SafeResult, ServiceUser };
export { toISOString };

/** Raw Firestore document type. Uses `unknown` for type safety — callers must narrow. */
export type Doc = Record<string, unknown>;

/** Firestore error codes that are safe to retry (transient failures). */
const RETRYABLE_CODES = new Set([
  'unavailable', 'resource-exhausted', 'deadline-exceeded', 'aborted', 'internal',
]);

/** Extract the Firestore error code from an error object or message string. */
const extractErrorCode = (err: unknown): string => {
  const e = err as { code?: string; message?: string };
  if (e.code) {
    const parts = e.code.split('/');
    return parts[parts.length - 1].toLowerCase();
  }
  const msg = e.message || '';
  const colonIdx = msg.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    return msg.slice(0, colonIdx).trim().toLowerCase().replace(/_/g, '-');
  }
  const lower = msg.toLowerCase();
  if (lower.includes('permission-denied') || lower.includes('permission')) return 'permission-denied';
  if (lower.includes('not-found')) return 'not-found';
  if (lower.includes('unauthenticated')) return 'unauthenticated';
  if (lower.includes('unavailable')) return 'unavailable';
  if (lower.includes('invalid-argument')) return 'invalid-argument';
  return 'unknown';
};

/** Map error codes to safe user-facing messages. */
const sanitizeError = (code: string, raw: string): string => {
  switch (code) {
    case 'permission-denied': return 'You don\'t have permission to perform this action.';
    case 'not-found': return 'The requested item was not found.';
    case 'already-exists': return 'This item already exists.';
    case 'unauthenticated': return 'Your session has expired. Please log in again.';
    case 'resource-exhausted': return 'Too many requests. Please wait a moment and try again.';
    case 'unavailable': return 'Network error. Please check your connection.';
    case 'deadline-exceeded': return 'The request timed out. Please try again.';
    case 'invalid-argument': return 'Invalid input. Please check your data and try again.';
    case 'failed-precondition': return 'This action cannot be performed right now. Please try again later.';
    case 'aborted': return 'The operation was interrupted. Please try again.';
    default: {
      if (!raw) return 'An unexpected error occurred. Please try again.';
      const lower = raw.toLowerCase();
      if (lower.includes('network')) return 'Network error. Please check your connection.';
      if (lower.includes('timeout')) return 'The request timed out. Please try again.';
      return 'Something went wrong. Please try again.';
    }
  }
};

export const safeHandle = async <T = true>(fn: () => Promise<T>): Promise<SafeResult<T>> => {
  try {
    const result = await fn();
    return { data: (result ?? true) as T };
  } catch (err: unknown) {
    const e = err as Error;
    const code = extractErrorCode(err);
    logger.error('[Firestore]', e);
    return {
      error: {
        message: sanitizeError(code, e.message || ''),
        code,
        retryable: RETRYABLE_CODES.has(code),
      },
    };
  }
};

export const docToObj = (snap: DocumentSnapshot): Doc | null =>
  snap.exists() ? { id: snap.id, ...snap.data() } : null;

export const docsToArr = (snap: QuerySnapshot): Doc[] =>
  snap.docs.map(d => ({ id: d.id, ...d.data() }));

export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};
