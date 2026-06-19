"use client";

import { useCallback } from "react";
import { supabase, type Json } from "@/integrations/supabase/client";

export type AnalyticsMetadata = Record<string, Json>;

export interface TrackEventResult {
  ok: boolean;
  error?: string;
}

export async function trackEvent(eventName: string, metadata: AnalyticsMetadata = {}): Promise<TrackEventResult> {
  const normalizedEventName = eventName.trim();

  if (!normalizedEventName) {
    return { ok: false, error: "eventName is required" };
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { ok: false, error: sessionError.message };
  }

  const response = await fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
    event_name: normalizedEventName,
    user_id: session?.user.id ?? null,
    metadata
    })
  });
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    return { ok: false, error: payload.error ?? "Analytics request failed" };
  }

  return { ok: true };
}

export function useAnalytics() {
  const track = useCallback((eventName: string, metadata: AnalyticsMetadata = {}) => trackEvent(eventName, metadata), []);

  return {
    trackEvent: track
  };
}
