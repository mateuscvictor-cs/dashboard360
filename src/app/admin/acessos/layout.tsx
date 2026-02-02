import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AcessosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role !== "ADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}
