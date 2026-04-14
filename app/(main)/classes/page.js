export const metadata = {
  title: "Classes",
  description: "Explore the live and recorded classes offered on the JUSTLearn platform.",
};

export default function ClassesPage() {
  return (
    <main className="container py-16 md:py-24 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
      <p className="text-muted-foreground text-lg max-w-3xl">
        Access your enrolled classes, discover new subjects, and connect with your instructors.
      </p>
    </main>
  );
}
