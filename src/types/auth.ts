export type UserRole = "ADMIN" | "CS_OWNER" | "CLIENT" | "CLIENT_MEMBER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  csOwnerId?: string | null;
  companyId?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    routes: ["/admin", "/admin/cs", "/admin/operacao", "/admin/empresas", "/admin/insights", "/admin/configuracoes"],
    canViewAllData: true,
    canManageUsers: true,
    canManageTemplates: true,
    canInviteMembers: false,
  },
  CS_OWNER: {
    routes: ["/admin", "/admin/cs", "/admin/empresas", "/admin/insights", "/admin/configuracoes"],
    canViewAllData: false,
    canManageUsers: false,
    canManageTemplates: false,
    canInviteMembers: false,
  },
  CLIENT: {
    routes: ["/cliente/dashboard", "/cliente/entregas", "/cliente/suporte", "/cliente/documentacao", "/cliente/configuracoes", "/cliente/recursos", "/cliente/agenda", "/cliente/pesquisas", "/cliente/notificacoes", "/cliente/diagnostico", "/cliente/equipe"],
    canViewAllData: false,
    canManageUsers: false,
    canManageTemplates: false,
    canInviteMembers: true,
  },
  CLIENT_MEMBER: {
    routes: ["/membro"],
    canViewAllData: false,
    canManageUsers: false,
    canManageTemplates: false,
    canInviteMembers: false,
  },
} as const;

export const CLIENT_MEMBER_ALLOWED_ROUTES = ["/membro"];

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  if (role === "ADMIN") {
    return pathname.startsWith("/admin") || pathname === "/";
  }

  if (role === "CS_OWNER") {
    if (pathname.startsWith("/admin/operacao")) return false;
    return pathname.startsWith("/admin") || pathname === "/";
  }

  if (role === "CLIENT") {
    return pathname.startsWith("/cliente") || pathname === "/";
  }

  if (role === "CLIENT_MEMBER") {
    if (pathname === "/") return true;
    return pathname.startsWith("/membro");
  }

  return false;
}

export function getDefaultRedirect(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CS_OWNER":
      return "/admin/cs";
    case "CLIENT":
      return "/cliente/dashboard";
    case "CLIENT_MEMBER":
      return "/membro";
    default:
      return "/";
  }
}
