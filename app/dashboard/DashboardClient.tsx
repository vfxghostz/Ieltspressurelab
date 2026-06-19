"use client";

import { useEffect } from "react";
import { DesignLab } from "@/src/components/DesignLab";
import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { useAnalytics } from "@/src/hooks/useAnalytics";

export function DashboardClient() {
  return (
    <ProtectedRoute>
      <DashboardBody />
    </ProtectedRoute>
  );
}

function DashboardBody() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    void trackEvent("page_view", {
      page: "dashboard",
      path: "/dashboard",
      title: "IELTS Pressure Lab Dashboard"
    });
  }, [trackEvent]);

  return <DesignLab />;
}
