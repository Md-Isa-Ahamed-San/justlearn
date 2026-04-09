import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { Award, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUserCertificates(userId) {
  const certificates = await db.certificate.findMany({
    where: { userId },
    include: {
      course: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return certificates;
}

export default async function AccountCertificatesPage() {
  const user = await getLoggedInUser();

  if (!user) redirect("/login");

  const certificates = await getUserCertificates(user.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground">
          View and download your earned certificates.
        </p>
      </div>

      <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow overflow-hidden w-96">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-b p-6 shrink-0">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                      Certificate of Completion
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base line-clamp-2 mb-1">
                      {cert.course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Issued on{" "}
                      {new Date(cert.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto">
                    <a
                      href={`/api/certificates/generate?id=${cert.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <Button size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">View &amp; Print</span>
                      </Button>
                    </a>
                    <Link href={`/courses/${cert.courseId}`} className="flex-1 min-w-0">
                      <Button size="sm" variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">View Course</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 border rounded-lg bg-muted/20">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No certificates yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete a course to earn your first certificate!
            </p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
