import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/signup", "/api/auth", "/share", "/api/share"];

function isPublicPath(pathname: string) {
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/placeholder.svg" ||
    pathname.startsWith("/api/tts") ||
    pathname.startsWith("/api/mastra") ||
    pathname.startsWith("/api/custom") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/artifacts")
  )
    return true;
  return false;
}

function hasSessionCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  return cookies.some((c) => c.name.includes("session_token") || c.name.includes("better-auth"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSessionCookie(request);

  if (isPublicPath(pathname)) {
    if (hasSession && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|placeholder.svg).*)",
  ],
};
