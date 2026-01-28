import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/contexts/user-context";
import { NotificationProvider } from "@/components/notifications";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <NotificationProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-mesh">
            {children}
          </main>
        </div>
      </NotificationProvider>
    </UserProvider>
  );
}
