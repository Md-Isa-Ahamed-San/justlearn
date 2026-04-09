"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Badge Definitions ─────────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  {
    name: "First Step",
    description: "Completed your very first lesson!",
    icon: "🎯",
    points: 0,
  },
  {
    name: "Lesson Streak",
    description: "Completed 10 lessons across all courses!",
    icon: "🔥",
    points: 0,
  },
  {
    name: "Quiz Master",
    description: "Scored 100% on a quiz!",
    icon: "🏆",
    points: 0,
  },
  {
    name: "High Achiever",
    description: "Scored 80% or above on a quiz!",
    icon: "⭐",
    points: 0,
  },
  {
    name: "Course Completer",
    description: "Successfully completed an entire course!",
    icon: "🎓",
    points: 0,
  },
];

// ─── Seed all badges (idempotent) ──────────────────────────────────────────
export async function seedBadges() {
  try {
    for (const badge of BADGE_DEFINITIONS) {
      await db.badge.upsert({
        where: { name: badge.name },
        update: {},
        create: badge,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Seed badges error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Award a badge by name (if not already earned) ────────────────────────
async function awardBadgeByName(userId, badgeName) {
  try {
    const badge = await db.badge.findFirst({ where: { name: badgeName } });
    if (!badge) return;
    await db.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
    console.log(`🏅 Awarded badge "${badgeName}" to user ${userId}`);
  } catch (error) {
    // Non-blocking — don't throw
    console.error(`Error awarding badge "${badgeName}":`, error);
  }
}

// ─── Check & Award After Lesson Completion ──────────────────────────────────
export async function checkBadgesAfterLesson(userId) {
  try {
    // 1. First Step badge — any lesson completed
    const totalCompleted = await db.lessonProgress.count({
      where: { userId, status: "completed" },
    });
    if (totalCompleted >= 1) {
      await awardBadgeByName(userId, "First Step");
    }

    // 2. Lesson Streak badge — 10 lessons total
    if (totalCompleted >= 10) {
      await awardBadgeByName(userId, "Lesson Streak");
    }
  } catch (error) {
    console.error("Error in checkBadgesAfterLesson:", error);
  }
}

// ─── Check & Award After Quiz Submission ────────────────────────────────────
export async function checkBadgesAfterQuiz(userId, score, maxScore) {
  try {
    if (maxScore <= 0) return;
    const percentage = (score / maxScore) * 100;

    // High Achiever: ≥ 80%
    if (percentage >= 80) {
      await awardBadgeByName(userId, "High Achiever");
    }

    // Quiz Master: 100%
    if (percentage >= 100) {
      await awardBadgeByName(userId, "Quiz Master");
    }
  } catch (error) {
    console.error("Error in checkBadgesAfterQuiz:", error);
  }
}

// ─── Check & Award After Course Completion ──────────────────────────────────
export async function checkBadgesAfterCourseComplete(userId) {
  try {
    await awardBadgeByName(userId, "Course Completer");
  } catch (error) {
    console.error("Error in checkBadgesAfterCourseComplete:", error);
  }
}

// ─────────────────────── ADMIN BADGE MANAGEMENT ─────────────────────────────

export async function getAllBadges() {
  try {
    const badges = await db.badge.findMany({
      include: {
        _count: { select: { userBadges: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, data: badges };
  } catch (error) {
    console.error("Get badges error:", error);
    return { success: false, error: error.message };
  }
}

export async function createBadge({ name, description, icon, points }) {
  try {
    const badge = await db.badge.create({
      data: { name, description, icon, points: parseInt(points) || 0 },
    });
    revalidatePath("/admin-dashboard");
    return { success: true, data: badge };
  } catch (error) {
    console.error("Create badge error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBadge(id, { name, description, icon, points }) {
  try {
    const badge = await db.badge.update({
      where: { id },
      data: { name, description, icon, points: parseInt(points) || 0 },
    });
    revalidatePath("/admin-dashboard");
    return { success: true, data: badge };
  } catch (error) {
    console.error("Update badge error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBadge(id) {
  try {
    // Delete all user badges first (cascade safety)
    await db.userBadge.deleteMany({ where: { badgeId: id } });
    await db.badge.delete({ where: { id } });
    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete badge error:", error);
    return { success: false, error: error.message };
  }
}
