/**
 * timestampUtils.js
 * Shared timestamp normalization — no Firestore SDK dependency.
 * Used by mappers.js, firestoreService.js, and realtime hooks.
 */

/** Normalize Firestore Timestamp, Date, or ISO string → ISO string */
export const toISOString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return '';
};
