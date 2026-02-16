import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClienteSidebar } from "@/components/layout/cliente-sidebar";
import { UserProvider } from "@/contexts/user-context";
import { PendingSurveysProvider } from "@/components/cliente";
import { NotificationProvider } from "@/components/notifications";
import { MobileSidebarProvider } from "@/contexts/mobile-sidebar-context";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";

export default async function ClienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "CLIENT_MEMBER") {
    redirect("/membro");
  }
  return (
    <UserProvider>
      <NotificationProvider>
        <PendingSurveysProvider>
          <MobileSidebarProvider>
            <div className="flex h-screen overflow-hidden">
              <ClienteSidebar />
              <main className="flex-1 overflow-auto bg-mesh relative">
                <MobileSidebarTrigger />
                {children}
              </main>
            </div>
          </MobileSidebarProvider>
        </PendingSurveysProvider>
      </NotificationProvider>
    </UserProvider>
  );
}
