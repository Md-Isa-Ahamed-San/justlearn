"use server";

import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLiveSession(data) {
    try {
        const user = await getLoggedInUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { title, description, date, time, meetLink } = data;

        if (!title || !date || !time || !meetLink) {
            return { success: false, error: "Missing required fields" };
        }

        // Combine date and time
        // Combine date and time robustly
        const schedule = new Date(date);
        if (typeof time === "string" && time.includes(":")) {
            const [hours, minutes] = time.split(":");
            schedule.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }

        await db.live.create({
            data: {
                title,
                description,
                schedule,
                meetLink,
                userId: user.id
            }
        });

        revalidatePath("/instructor-dashboard/lives");
        return { success: true };

    } catch (error) {
        console.error("Create Live Session Error:", error);
        return { success: false, error: "Failed to create session" };
    }
}

export async function updateLiveSession(liveId, data) {
    try {
        const user = await getLoggedInUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { title, description, date, time, meetLink, videoId } = data;
        
        // Combine date and time robustly
        const schedule = new Date(date);
        if (typeof time === "string" && time.includes(":")) {
            const [hours, minutes] = time.split(":");
            schedule.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }

        await db.live.update({
            where: { 
                id: liveId,
                userId: user.id 
            },
            data: {
                title,
                description,
                schedule,
                meetLink,
                ...(videoId !== undefined && { videoId }),
            }
        });

        revalidatePath("/instructor-dashboard/lives");
        return { success: true };
    } catch (error) {
        console.error("Update Live Session Error:", error);
        return { success: false, error: "Failed to update session" };
    }
}

export async function deleteLiveSession(liveId) {
    try {
        const user = await getLoggedInUser();
        if (!user) return { success: false, error: "Unauthorized" };

        await db.live.delete({
            where: {
                id: liveId,
                userId: user.id
            }
        });

        revalidatePath("/instructor-dashboard/lives");
        return { success: true };
    } catch (error) {
        console.error("Delete Live Session Error:", error);
        return { success: false, error: "Failed to delete session" };
    }
}
