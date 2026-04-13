/**
 * rateLimit.js
 * Simple client-side debounce guard for action handlers.
 * Prevents rapid duplicate submissions (double-clicks, etc.).
 */

const pending = new Map();

/**
 * Returns a wrapped version of `fn` that rejects if called again
 * before the previous invocation resolves.
 * Key is used to track independent actions (e.g. 'sendMessage', 'assignReferee').
 */
export const guardAction = (key, fn) => async (...args) => {
  if (pending.get(key)) return;
  pending.set(key, true);
  try {
    return await fn(...args);
  } finally {
    pending.set(key, false);
  }
};
