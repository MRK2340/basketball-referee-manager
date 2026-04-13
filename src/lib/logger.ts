/**
 * logger.ts
 * Production-safe logging utility backed by Sentry in production.
 * SETUP: Set VITE_SENTRY_DSN in your .env to enable Sentry.
 */
import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (!isDev && dsn) {
  Sentry.init({
    dsn,
    environment: (import.meta.env.MODE as string) || 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const logger = {
  error: (tag: string, ...args: unknown[]): void => {
    if (isDev) {
      console.error(tag, ...args);
    } else if (dsn) {
      const err = args.find((a): a is Error => a instanceof Error);
      if (err) {
        Sentry.captureException(err, { tags: { source: tag } });
      } else {
        Sentry.captureMessage(`${tag} ${args.map(String).join(' ')}`, 'error');
      }
    }
  },
  warn: (tag: string, ...args: unknown[]): void => {
    if (isDev) {
      console.warn(tag, ...args);
    } else if (dsn) {
      Sentry.captureMessage(`${tag} ${args.map(String).join(' ')}`, 'warning');
    }
  },
  info: (tag: string, ...args: unknown[]): void => {
    if (isDev) {
      console.info(tag, ...args);
    }
  },
};

export { Sentry };
