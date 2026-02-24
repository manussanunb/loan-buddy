import { NextRequest } from "next/server";

// In-memory rate limiter — resets on server restart.
// Suitable for single-instance deployments; swap for Redis in multi-instance setups.

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

const store = new Map<string, AttemptRecord>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Returns whether the IP is currently blocked and, if so, how many seconds remain. */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = store.get(ip);

  if (!record) return { allowed: true };

  if (record.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  // Window expired — treat as fresh slate
  if (now - record.windowStart > WINDOW_MS) {
    store.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/** Call this after each failed login attempt. */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
  store.set(ip, record);
}

/** Call this on successful login to reset the counter. */
export function clearAttempts(ip: string): void {
  store.delete(ip);
}
