export const metadata = {
  title: "Categories",
  description: "Browse all course categories available on JUSTLearn.",
};

export default function CategoriesPage() {
  return (
    <main className="container py-16 md:py-24 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Course Categories</h1>
      <p className="text-muted-foreground text-lg max-w-3xl">
        Explore a wide variety of subjects tailored for academic excellence and skill development.
      </p>
    </main>
  );
}
