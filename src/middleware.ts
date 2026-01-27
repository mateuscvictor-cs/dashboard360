import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "ADMIN" | "CS_OWNER" | "CLIENT";

type SessionData = {
  session: {
    id: string;
    userId: string;
  };
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") 
  ) {
    return NextResponse.next();
  }

  let session: SessionData | null = null;

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    
    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      method: "GET",
      headers: {
        "cookie": cookieHeader,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.session) {
        session = data;
      }
    }
  } catch {
    session = null;
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
