import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/contexts/user-context";
import { NotificationProvider } from "@/components/notifications";
import { AIBubble } from "@/components/ai-assistant/ai-bubble";
import { MobileSidebarProvider } from "@/contexts/mobile-sidebar-context";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <NotificationProvider>
        <MobileSidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-mesh relative">
              <MobileSidebarTrigger />
              {children}
            </main>
          </div>
        </MobileSidebarProvider>
        <AIBubble />
      </NotificationProvider>
    </UserProvider>
  );
}
