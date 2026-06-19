"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/client";
import { useAdminAccess } from "@/src/hooks/useAdminAccess";

type UserEventRow = Database["public"]["Tables"]["user_events"]["Row"];

export function AdminClient() {
  const router = useRouter();
  const { isChecking, isAdmin, reason } = useAdminAccess();
  const [events, setEvents] = useState<UserEventRow[]>([]);
  const [error, setError] = useState("");
  const [storage, setStorage] = useState<"supabase" | "local-fallback" | "unknown">("unknown");
  const [supabaseError, setSupabaseError] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError("");

    const response = await fetch("/api/admin/user-events?limit=50", {
      cache: "no-store"
    });
    const responseText = await response.text();
    const payload = responseText
      ? (JSON.parse(responseText) as { events?: UserEventRow[]; error?: string; storage?: "supabase" | "local-fallback"; supabaseError?: string })
      : ({ error: `Empty response from /api/admin/user-events (${response.status})` } satisfies { error: string });

    if (!response.ok || !payload.events) {
      setError(payload.error ?? "Unable to load user_events");
      setStorage("unknown");
      setSupabaseError("");
      setEvents([]);
    } else {
      setEvents(payload.events);
      setStorage(payload.storage ?? "supabase");
      setSupabaseError(payload.supabaseError ?? "");
    }

    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    if (!isChecking && !isAdmin) {
      router.replace("/login");
    }
  }, [isAdmin, isChecking, router]);

  useEffect(() => {
    if (isAdmin) {
      void loadEvents();
    }
  }, [isAdmin, loadEvents]);

  if (isChecking || !isAdmin) {
    return (
      <main className="route-state" aria-live="polite">
        <section>
          <p className="micro-label">Admin access</p>
          <h1>{isChecking ? "Checking admin role" : "Redirecting to login"}</h1>
          <p>{reason}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel" aria-labelledby="admin-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">Temporary local admin bypass</p>
            <h1 id="admin-title">Analytics logs</h1>
          </div>
          <ShieldCheck size={22} />
        </div>
        <p>
          Admin access reason: <strong>{reason}</strong>
        </p>
        <p>
          Event storage: <strong>{storage}</strong>
        </p>
        {supabaseError && <p className="backend-warning">Supabase fallback reason: {supabaseError}</p>}
        <button type="button" className="secondary-action" onClick={loadEvents} disabled={loadingEvents}>
          <RefreshCw size={18} />
          <span>{loadingEvents ? "Loading..." : "Refresh events"}</span>
        </button>
      </section>

      {error && (
        <section className="admin-panel admin-warning">
          <p className="micro-label">Supabase read blocked</p>
          <h2>Cannot read user_events</h2>
          <p>{error}</p>
          <p>
            This page reads through <code>/api/admin/user-events</code> with a server-only Supabase service role key. If it still fails, restart the
            local dev server so `.env.local` is reloaded.
          </p>
        </section>
      )}

      <section className="admin-panel" aria-labelledby="events-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">user_events</p>
            <h2 id="events-title">Latest {events.length} events</h2>
          </div>
        </div>
        <div className="admin-table" role="table" aria-label="User events">
          <div role="row" className="admin-table-head">
            <span role="columnheader">created_at</span>
            <span role="columnheader">event_name</span>
            <span role="columnheader">user_id</span>
            <span role="columnheader">metadata</span>
          </div>
          {events.map((event) => (
            <div role="row" key={event.id}>
              <span role="cell">{new Date(event.created_at).toLocaleString()}</span>
              <strong role="cell">{event.event_name}</strong>
              <span role="cell">{event.user_id ?? "anonymous"}</span>
              <code role="cell">{JSON.stringify(event.metadata ?? {})}</code>
            </div>
          ))}
          {!events.length && !error && <p>No events loaded yet.</p>}
        </div>
      </section>
    </main>
  );
}
