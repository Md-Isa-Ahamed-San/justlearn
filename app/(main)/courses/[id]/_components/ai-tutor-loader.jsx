"use client";

// Client wrapper required: `ssr: false` is only permitted in Client Components.
// The Server Component (CourseDetails.jsx) imports this file instead.
import dynamic from "next/dynamic";

const AITutorWidget = dynamic(
  () => import("../../../../../components/ai-tutor-widget").then(m => m.AITutorWidget),
  { ssr: false, loading: () => null }
);

export default AITutorWidget;
