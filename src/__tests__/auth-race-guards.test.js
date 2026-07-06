/**
 * auth-race-guards.test.js
 * Source-level regression guards for the AuthContext race fixes.
 *
 * AuthProvider is a React component (useState/useEffect) and this suite has
 * no DOM renderer, so — matching the pattern used by
 * security-and-quality.test.js — these tests assert the guard code exists
 * rather than exercising it. They exist to fail loudly if a refactor drops
 * either race fix:
 *  1. A slow sign-in profile fetch (1.5s retry) finishing after a sign-out
 *     must not re-install the signed-out user.
 *  2. Registration must not race the auth listener against the profile
 *     write, and must end its transient Firebase session so the
 *     "register, then sign in" flow is real.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(
  path.join(process.cwd(), 'src/contexts/AuthContext.tsx'),
  'utf8'
);

describe('Auth listener sequencing (stale sign-in vs. sign-out race)', () => {
  it('assigns a generation id per auth event', () => {
    expect(src).toContain('const authEventGen = useRef(0)');
    expect(src).toContain('const gen = ++authEventGen.current');
  });

  it('discards results from superseded auth events', () => {
    expect(src).toContain('const isStale = () => gen !== authEventGen.current');
    // The guard must run after the awaited retry loop, before user state is set
    const retryLoopEnd = src.indexOf('if (lastErr) {');
    const staleCheck = src.lastIndexOf('if (isStale()) return;', retryLoopEnd);
    expect(staleCheck).toBeGreaterThan(-1);
    expect(staleCheck).toBeLessThan(retryLoopEnd);
  });

  it('invalidates in-flight handlers on unsubscribe', () => {
    expect(src).toContain('authEventGen.current++;\n      unsubscribe();');
  });
});

describe('Registration vs. auth-listener race', () => {
  it('marks registration in flight around the transient session', () => {
    expect(src).toContain('const registrationInFlight = useRef(false)');
    expect(src).toContain('registrationInFlight.current = true');
    // reset must live in finally so failures clear the flag too
    const finallyIdx = src.indexOf('registrationInFlight.current = false');
    expect(finallyIdx).toBeGreaterThan(-1);
    const surrounding = src.slice(finallyIdx - 120, finallyIdx);
    expect(surrounding).toContain('finally');
  });

  it('auth listener skips events for the in-flight registration session', () => {
    expect(src).toContain('if (registrationInFlight.current) return;');
  });

  it('register ends the transient session so "you can now sign in" is true', () => {
    const setDocIdx = src.indexOf("setDoc(doc(db, 'users', fbUser.uid), profile)");
    const signOutIdx = src.indexOf('await signOut(auth);', setDocIdx);
    expect(setDocIdx).toBeGreaterThan(-1);
    expect(signOutIdx).toBeGreaterThan(setDocIdx);
  });
});
