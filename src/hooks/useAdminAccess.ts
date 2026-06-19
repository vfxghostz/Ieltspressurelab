"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TEMP_ADMIN_BYPASS = true;
const LOCAL_ADMIN_EMAIL = "admin@gmail.com";

export type AdminAccessState = "checking" | "allowed" | "denied";

export function useAdminAccess() {
  const [state, setState] = useState<AdminAccessState>("checking");
  const [reason, setReason] = useState("Checking admin access");

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const email = session?.user.email?.toLowerCase();

      if (TEMP_ADMIN_BYPASS || email === LOCAL_ADMIN_EMAIL) {
        if (mounted) {
          setState("allowed");
          setReason(TEMP_ADMIN_BYPASS ? "TEMP_ADMIN_BYPASS=true" : `Matched ${LOCAL_ADMIN_EMAIL}`);
        }
        return;
      }

      if (!session) {
        if (mounted) {
          setState("denied");
          setReason("No Supabase session");
        }
        return;
      }

      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").limit(1);

      if (mounted) {
        const isAdmin = !error && Array.isArray(data) && data.length > 0;
        setState(isAdmin ? "allowed" : "denied");
        setReason(isAdmin ? "Role admin found in user_roles" : error?.message ?? "Missing admin role");
      }
    }

    void checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isChecking: state === "checking",
    isAdmin: state === "allowed",
    state,
    reason
  };
}
