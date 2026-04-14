export const metadata = {
  title: "Blog",
  description: "Read the latest news, updates, and educational insights from JUSTLearn.",
};

export default function BlogPage() {
  return (
    <main className="container py-16 md:py-24 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      <p className="text-muted-foreground text-lg max-w-3xl">
        Stay up-to-date with the latest announcements, educational trends, and platform updates.
      </p>
    </main>
  );
}
