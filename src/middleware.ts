import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "ADMIN" | "CS_OWNER" | "CLIENT";

type SessionUser = {
  name: string;
  email: string;
  role: UserRole;
};

type SessionPayload = {
  session: unknown;
  user: SessionUser;
};

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

function parseSessionFromCookie(cookieValue: string): SessionPayload | null {
  try {
    const decoded = decodeURIComponent(cookieValue);
    const jsonStr = atob(decoded.split(".")[0]);
    const data = JSON.parse(jsonStr);
    if (data && data.user) {
      return data as SessionPayload;
    }
  } catch {
    return null;
  }
  return null;
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

  let session: SessionPayload | null = null;
  
  const sessionDataCookie = request.cookies.get("__Secure-better-auth.session_data")?.value 
    || request.cookies.get("better-auth.session_data")?.value;
  
  if (sessionDataCookie) {
    session = parseSessionFromCookie(sessionDataCookie);
  }

  const isAuthenticated = !!session;
  const isPublic = isPublicRoute(pathname);
  const userRole = session?.user?.role || "CLIENT";

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
