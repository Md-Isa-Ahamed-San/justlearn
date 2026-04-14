export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin-dashboard/", "/student-dashboard/", "/instructor-dashboard/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
