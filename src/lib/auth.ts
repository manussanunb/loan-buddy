import { NextRequest, NextResponse } from "next/server";
import { Session, Role } from "@/types";

const SESSION_COOKIE = "lb_session";
const ROLE_COOKIE = "lb_role";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Simple HMAC-SHA256 signing using Web Crypto API (available in Next.js edge/server)
async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function verify(payload: string, signature: string): Promise<boolean> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sigBytes = Buffer.from(signature, "base64url");
  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
}

export async function createSessionToken(role: Role): Promise<string> {
  const session: Session = {
    role,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string
): Promise<Session | null> {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const valid = await verify(payload, sig);
    if (!valid) return null;
    const session: Session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookies(
  response: NextResponse,
  role: Role,
  token: string
): void {
  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };

  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieOpts,
    httpOnly: true, // session token is HttpOnly
  });

  response.cookies.set(ROLE_COOKIE, role, {
    ...cookieOpts,
    httpOnly: false, // role cookie readable by client for UI gating
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ROLE_COOKIE);
}

// Guard helpers for API routes
export async function requireAnyRole(
  req: NextRequest
): Promise<Session | NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireAdmin(
  req: NextRequest
): Promise<Session | NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export function isAuthError(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}

export const ROLE_COOKIE_NAME = ROLE_COOKIE;
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
