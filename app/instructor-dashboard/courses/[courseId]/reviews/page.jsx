import { db } from "@/lib/prisma";
import { Star, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

export const dynamic = "force-dynamic";

const ReviewsPage = async ({ params }) => {
  const { courseId } = await params;

  if (!courseId) return notFound();

  // Fetch real testimonials from the database
  const testimonials = await db.testimonial.findMany({
    where: { courseId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Shape data to match the columns definition
  const reviews = testimonials.map((t) => ({
    id: t.id,
    student: { name: t.user?.name ?? "Unknown", email: t.user?.email ?? "" },
    review: t.content,
    rating: t.rating ?? 0,
    createdAt: t.createdAt,
  }));

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold">{avgRating}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
          <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No reviews yet</h3>
          <p className="text-sm text-muted-foreground">
            Students who complete your course will be able to leave reviews here.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={reviews} />
      )}
    </div>
  );
};

export default ReviewsPage;
