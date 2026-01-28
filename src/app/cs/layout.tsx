import { CSSidebar } from "@/components/layout/cs-sidebar";
import { UserProvider } from "@/contexts/user-context";
import { NotificationProvider } from "@/components/notifications";

export default function CSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          <CSSidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </NotificationProvider>
    </UserProvider>
  );
}
