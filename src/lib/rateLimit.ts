/**
 * rateLimit.ts
 * Simple client-side debounce guard for action handlers.
 * Prevents rapid duplicate submissions (double-clicks, etc.).
 */

const pending = new Map<string, boolean>();

/**
 * Returns a wrapped version of `fn` that rejects if called again
 * before the previous invocation resolves.
 */
export const guardAction = <T extends (...args: unknown[]) => Promise<unknown>>(
  key: string,
  fn: T,
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined>) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
    if (pending.get(key)) return undefined;
    pending.set(key, true);
    try {
      return (await fn(...args)) as Awaited<ReturnType<T>>;
    } finally {
      pending.set(key, false);
    }
  };
};
