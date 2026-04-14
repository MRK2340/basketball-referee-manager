/**
 * performanceTraces.ts
 * Custom Firebase Performance traces for key app flows.
 * Auto-collected metrics (page load, network latency) are handled by the SDK.
 * This module adds custom traces for specific operations.
 */
import { trace as createTrace, type PerformanceTrace } from 'firebase/performance';
import { performance } from './firebase';

/** Start a named custom trace. Returns the trace (call .stop() when done) or null if perf is unavailable. */
export const startTrace = (name: string): PerformanceTrace | null => {
  if (!performance) return null;
  try {
    const t = createTrace(performance, name);
    t.start();
    return t;
  } catch {
    return null;
  }
};

/** Stop a trace (no-op if null). */
export const stopTrace = (t: PerformanceTrace | null): void => {
  if (t) {
    try { t.stop(); } catch { /* already stopped */ }
  }
};

/** Convenience: trace an async operation end-to-end. */
export const traceAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const t = startTrace(name);
  try {
    const result = await fn();
    stopTrace(t);
    return result;
  } catch (err) {
    if (t) {
      try { t.putAttribute('error', 'true'); } catch { /* */ }
    }
    stopTrace(t);
    throw err;
  }
};
