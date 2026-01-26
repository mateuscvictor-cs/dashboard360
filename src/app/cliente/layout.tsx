import { ClienteSidebar } from "@/components/layout/cliente-sidebar";
import { UserProvider } from "@/contexts/user-context";
import { PendingSurveysProvider } from "@/components/cliente";

export default function ClienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <PendingSurveysProvider>
        <div className="flex h-screen overflow-hidden">
          <ClienteSidebar />
          <main className="flex-1 overflow-auto bg-mesh">
            {children}
          </main>
        </div>
      </PendingSurveysProvider>
    </UserProvider>
  );
}
