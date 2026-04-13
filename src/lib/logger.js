/**
 * logger.js
 * Production-safe logging utility.
 * In development: logs to console as normal.
 * In production: suppresses verbose error details (swap with Sentry/Datadog later).
 */

const isDev = import.meta.env.DEV;

export const logger = {
  error: (tag, ...args) => {
    if (isDev) {
      console.error(tag, ...args);
    }
    // Production: silently swallow or forward to monitoring service
    // e.g. Sentry.captureException(args[0]);
  },
  warn: (tag, ...args) => {
    if (isDev) {
      console.warn(tag, ...args);
    }
  },
  info: (tag, ...args) => {
    if (isDev) {
      console.info(tag, ...args);
    }
  },
};
