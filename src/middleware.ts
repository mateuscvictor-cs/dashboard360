import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "ADMIN" | "CS_OWNER" | "CLIENT";

const PUBLIC_ROUTES = ["/", "/login", "/registro", "/esqueci-senha", "/redefinir-senha", "/verificar-email", "/convite"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function getRedirectUrl(role: UserRole): string {
  switch (role) {
    case "ADMIN": return "/admin";
    case "CS_OWNER": return "/cs";
    case "CLIENT": return "/cliente/dashboard";
    default: return "/";
  }
}

function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "ADMIN") return true;
  if (role === "CS_OWNER") return pathname.startsWith("/cs");
  if (role === "CLIENT") return pathname.startsWith("/cliente");
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("authjs.session-token")?.value || 
                       request.cookies.get("__Secure-authjs.session-token")?.value;
  
  const isAuthenticated = !!sessionToken;
  const isPublic = isPublicRoute(pathname);

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl && !isPublicRoute(callbackUrl)) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
