export const metadata = {
  title: "About Us",
  description: "Learn more about JUSTLearn and our mission to provide advanced e-learning.",
};

export default function AboutPage() {
  return (
    <main className="container py-16 md:py-24 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">About Us</h1>
      <p className="text-muted-foreground text-lg max-w-3xl">
        JUSTLearn is an advanced e-learning platform dedicated to providing high-quality 
        academic content and AI-driven assessments for students and faculty.
      </p>
    </main>
  );
}
