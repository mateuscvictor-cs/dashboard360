import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

export async function requireCompanyAccess(companyId: string) {
  const session = await requireRole(["ADMIN", "CS_OWNER"]);
  const user = session.user as { role?: string; csOwnerId?: string };
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, csOwnerId: true },
  });
  if (!company) {
    throw new Error("CompanyNotFound");
  }
  if (user.role === "CS_OWNER" && company.csOwnerId !== user.csOwnerId) {
    throw new Error("Forbidden");
  }
  return session;
}
