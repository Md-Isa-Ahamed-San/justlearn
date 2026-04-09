import { Button } from "@/components/ui/button";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";
// Add this to pages that use headers(), cookies(), etc.
export const dynamic = 'force-dynamic'

async function getLiveSessions() {
    const user = await getLoggedInUser();
    if (!user) return [];

    return await db.live.findMany({
        where: { userId: user.id },
        orderBy: { schedule: 'asc' }
    });
}

const LivesPage = async () => {
  const lives = await getLiveSessions();

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Live Sessions</h2>
        <Link href="/instructor-dashboard/lives/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Session
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={lives} />
    </div>
  );
};

export default LivesPage;
