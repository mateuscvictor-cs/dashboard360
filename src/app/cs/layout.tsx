import { CSSidebar } from "@/components/layout/cs-sidebar";
import { UserProvider } from "@/contexts/user-context";
import { NotificationProvider } from "@/components/notifications";
import { AIBubble } from "@/components/ai-assistant/ai-bubble";
import { MobileSidebarProvider } from "@/contexts/mobile-sidebar-context";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";

export default function CSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <NotificationProvider>
        <MobileSidebarProvider>
          <div className="flex h-screen bg-background overflow-hidden">
            <CSSidebar />
            <main className="flex-1 overflow-hidden relative">
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
