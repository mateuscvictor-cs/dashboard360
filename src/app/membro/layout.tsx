import { MemberNavbar } from "@/components/layout/member-navbar";
import { UserProvider } from "@/contexts/user-context";
import { NotificationProvider } from "@/components/notifications";

export default function MembroLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <UserProvider>
            <NotificationProvider>
                <div className="flex flex-col min-h-screen bg-mesh">
                    <MemberNavbar />
                    <main className="flex-1">{children}</main>
                </div>
            </NotificationProvider>
        </UserProvider>
    );
}
