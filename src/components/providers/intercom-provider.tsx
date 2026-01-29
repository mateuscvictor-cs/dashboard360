"use client";

import Intercom from "@intercom/messenger-js-sdk";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function IntercomProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      Intercom({
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID!,
        user_id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      });
      initialized.current = true;
    } else if (status === "unauthenticated" && !initialized.current) {
      Intercom({
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID!,
      });
      initialized.current = true;
    }
  }, [session, status]);

  return <>{children}</>;
}
