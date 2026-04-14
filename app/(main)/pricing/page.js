export const metadata = {
  title: "Pricing",
  description: "View pricing plans and subscription options for JUSTLearn.",
};

export default function PricingPage() {
  return (
    <main className="container py-16 md:py-24 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
      <p className="text-muted-foreground text-lg max-w-3xl">
        Find the right plan for your educational needs. We offer flexible options for both individuals and institutions.
      </p>
    </main>
  );
}
