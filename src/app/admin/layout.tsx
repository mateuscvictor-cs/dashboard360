import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/contexts/user-context";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-mesh">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
