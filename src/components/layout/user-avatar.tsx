"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
};

export function useUserProfile() {
  const { user, loading, error } = useUser();
  return { user, loading, error };
}

export function UserAvatar({ 
  user, 
  size = "md",
  showStatus = true 
}: { 
  user: UserData | null; 
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const statusSizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getGradientByRole = (role: string) => {
    switch (role) {
      case "ADMIN": return "from-indigo-400 to-purple-500";
      case "CS_OWNER": return "from-blue-400 to-cyan-500";
      case "CLIENT": return "from-emerald-400 to-teal-500";
      default: return "from-slate-400 to-zinc-500";
    }
  };

  return (
    <div className="relative">
      {user?.image ? (
        <img
          src={user.image}
          alt={user.name || "Avatar"}
          className={cn(
            "rounded-full object-cover border-2 border-background shadow-md",
            sizeClasses[size]
          )}
        />
      ) : (
        <div className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white shadow-md bg-gradient-to-br",
          sizeClasses[size],
          getGradientByRole(user?.role || "")
        )}>
          {getInitials(user?.name || null)}
        </div>
      )}
      {showStatus && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full bg-success border-2 border-sidebar",
          statusSizeClasses[size]
        )} />
      )}
    </div>
  );
}

export function UserInfo({
  user,
  collapsed = false,
}: {
  user: UserData | null;
  collapsed?: boolean;
}) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Administrador";
      case "CS_OWNER": return "Sucesso do Cliente";
      case "CLIENT": return "Cliente";
      default: return role;
    }
  };

  if (collapsed) {
    return <UserAvatar user={user} />;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-muted to-muted/50 p-3">
      <UserAvatar user={user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {user?.name || "Usuário"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user?.role ? getRoleLabel(user.role) : ""}
        </p>
      </div>
    </div>
  );
}
