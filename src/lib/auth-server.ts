import { auth } from "@/auth";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = session.user?.role || "CLIENT";
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }
  
  return session;
}
