import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";

type UserRole = "ADMIN" | "CS_OWNER" | "CLIENT";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/registro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/verificar-email",
  "/convite",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "ADMIN") {
    return pathname.startsWith("/admin") || pathname.startsWith("/cliente") || pathname.startsWith("/cs");
  }

  if (role === "CS_OWNER") {
    return pathname.startsWith("/cs");
  }

  if (role === "CLIENT") {
    return pathname.startsWith("/cliente");
  }

  return false;
}

function getRedirectUrl(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CS_OWNER":
      return "/cs";
    case "CLIENT":
      return "/cliente/dashboard";
    default:
      return "/";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") 
  ) {
    return NextResponse.next();
  }

  let session: Session | null = null;

  try {
    const cookies = request.headers.get("cookie") || "";
    const response = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: cookies,
        },
        credentials: "include",
      }
    );
    session = response.data;
  } catch {
    session = null;
  }

  const isAuthenticated = !!session;
  const isPublic = isPublicRoute(pathname);
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role || "CLIENT";

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    const redirectUrl = getRedirectUrl(userRole);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (isAuthenticated && !isPublic) {
    const isAdminRoute = pathname.startsWith("/admin");
    const isClientRoute = pathname.startsWith("/cliente");
    const isCSRoute = pathname.startsWith("/cs");

    if ((isAdminRoute || isClientRoute || isCSRoute) && !canAccessRoute(userRole, pathname)) {
      const redirectUrl = getRedirectUrl(userRole);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
