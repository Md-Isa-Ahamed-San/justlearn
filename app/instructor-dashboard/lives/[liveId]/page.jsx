import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EditLiveForm } from "../_components/edit-live-form";

export const dynamic = 'force-dynamic';

export default async function EditLivePage({ params }) {
    const { liveId } = params;
    const user = await getLoggedInUser();
    
    if (!user) redirect("/login");

    const live = await db.live.findUnique({
        where: { 
            id: liveId,
            userId: user.id 
        }
    });

    if (!live) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <h1 className="text-2xl font-bold">Session not found</h1>
                <p className="text-muted-foreground mt-2">The live session you are trying to edit does not exist or you do not have permission to view it.</p>
            </div>
        );
    }

    return <EditLiveForm initialData={live} liveId={liveId} />;
}
