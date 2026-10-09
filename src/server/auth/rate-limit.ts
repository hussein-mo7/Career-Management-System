import { ApiError } from "@/lib/errors";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function assertLoginAllowed(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return;
  if (entry.count >= MAX_ATTEMPTS) {
    throw new ApiError("Too many login attempts. Try again in a few minutes.", 429);
  }
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}

export function resetLoginAttemptsForTests() {
  attempts.clear();
}
