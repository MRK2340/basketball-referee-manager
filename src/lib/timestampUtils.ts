/**
 * timestampUtils.ts
 * Shared timestamp normalization — no Firestore SDK dependency.
 */

interface FirestoreTimestamp {
  toDate: () => Date;
}

/** Normalize Firestore Timestamp, Date, or ISO string → ISO string */
export const toISOString = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof (val as FirestoreTimestamp)?.toDate === 'function') {
    return (val as FirestoreTimestamp).toDate().toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  return '';
};
