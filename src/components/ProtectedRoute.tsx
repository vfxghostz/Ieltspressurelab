"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

type SessionState = "checking" | "authenticated" | "anonymous";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>("checking");

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session) {
        setSessionState("anonymous");
        router.replace("/login");
        return;
      }

      setSessionState("authenticated");
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (sessionState !== "authenticated") {
    return (
      <main className="route-state" aria-live="polite">
        <section>
          <p className="micro-label">{sessionState === "checking" ? "Checking session" : "Redirecting"}</p>
          <h1>{sessionState === "checking" ? "Opening dashboard" : "Login required"}</h1>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
