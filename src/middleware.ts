import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

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

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const session = req.auth;
  const isAuthenticated = !!session?.user;
  const isPublic = isPublicRoute(pathname);
  const userRole = (session?.user?.role as UserRole) || "CLIENT";

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL(getRedirectUrl(userRole), req.url));
  }

  if (isAuthenticated && !isPublic && !canAccessRoute(userRole, pathname)) {
    return NextResponse.redirect(new URL(getRedirectUrl(userRole), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
