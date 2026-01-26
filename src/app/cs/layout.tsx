import { CSSidebar } from "@/components/layout/cs-sidebar";
import { UserProvider } from "@/contexts/user-context";

export default function CSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <CSSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
