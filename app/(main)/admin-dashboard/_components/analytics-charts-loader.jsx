"use client";

// Client wrapper required: `ssr: false` is only permitted in Client Components.
// The Server Component (admin-dashboard.jsx) imports this file instead.
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(
  () => import("./analytics-charts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    ),
  }
);

export default AnalyticsCharts;
