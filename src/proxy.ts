import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

// Admin-only page paths (prefix match)
const ADMIN_ONLY_PATHS = [
  "/loans/new",
  "/loans/",  // covers /loans/[id]/edit and /loans/[id]/repayments/*
];

function isAdminOnlyPath(pathname: string): boolean {
  if (pathname === "/loans/new") return true;
  // Edit and repayment sub-paths under /loans/[id]
  if (/^\/loans\/[^/]+\/edit/.test(pathname)) return true;
  if (/^\/loans\/[^/]+\/repayments/.test(pathname)) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("lb_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access for admin-only paths
  if (isAdminOnlyPath(pathname) && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
