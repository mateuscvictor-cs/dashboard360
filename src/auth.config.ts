import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      
      const publicRoutes = ["/", "/login", "/registro", "/esqueci-senha", "/redefinir-senha", "/verificar-email", "/convite"];
      const isPublicRoute = publicRoutes.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
        return true;
      }
      
      if (!isLoggedIn && !isPublicRoute) {
        return false;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.csOwnerId = user.csOwnerId;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
        session.user.csOwnerId = token.csOwnerId;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
