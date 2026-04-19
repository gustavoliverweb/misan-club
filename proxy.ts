import { NextRequest, NextResponse } from "next/server";

// Auth.js v5 session cookie names (different in prod vs dev)
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
}

// Only run on protected routes — auth pages (/login, /register) are never intercepted
// so their searchParams reach the page intact.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/my-network/:path*",
    "/settings/:path*",
  ],
};
