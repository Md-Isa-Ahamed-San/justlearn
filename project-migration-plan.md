I'll analyze all the provided documents and deliver a complete, production-grade migration plan. Let me structure this systematically.Here's the complete, production-grade migration plan.

---

## Part 1: Architecture Overview

The core shift is from a global `Student.idNumber` identity model to a **per-enrollment identity** model. Here's the top-level before/after flow:---

## Part 2: Prisma Schema — Before vs After (Diff Style)

### Models to REMOVE or SIMPLIFY

**`Student` model** — strip `idNumber`, `session`, `department` as global fields. These become irrelevant at the student level since identity is now per-enrollment.

**`CourseProgress`** — the denormalized count fields (`totalWeeks`, `totalLessons`, `totalQuizzes`, `completedWeeks`) are removed. Progress is computed from `LessonProgress` and `QuizSubmission` with proper queries, not stored redundantly.

**`Participation` and `Report`** — these are ghost models with `Json` blobs and no clear schema. Both are dropped; their function is absorbed into `Enrollment` and `QuizSubmission`.

### New and Modified Models

```prisma
// ── SIMPLIFIED: Student profile (no global idNumber)
model Student {
  id          String  @id @default(cuid())
  phone       String?
  bio         String?
  profilePicture String?
  socialMedia Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId      String   @unique
  user        User     @relation("UserStudent", fields: [userId], references: [id])

  enrollments Enrollment[]
}

// ── NEW: Batch — scoped to a single course
model Batch {
  id        String   @id @default(cuid())
  name      String                       // e.g. "Batch 8"
  courseId  String
  startDate DateTime?
  endDate   DateTime?
  status    BatchStatus @default(upcoming)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course      Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  enrollments Enrollment[]

  @@unique([courseId, name])             // no two "Batch 8"s for the same course
  @@index([courseId, status])
}

enum BatchStatus {
  upcoming
  active
  completed
}

// ── NEW: Enrollment — the core join entity
model Enrollment {
  id           String           @id @default(cuid())
  phStudentId  String           // scoped per enrollment, NOT globally unique
  status       EnrollmentStatus @default(active)
  enrolledAt   DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  studentId    String
  courseId     String
  batchId      String

  student      Student          @relation(fields: [studentId], references: [id])
  course       Course           @relation(fields: [courseId], references: [id])
  batch        Batch            @relation(fields: [batchId], references: [id])

  @@unique([studentId, courseId])        // one active enrollment per course
  @@index([courseId, batchId])
  @@index([phStudentId, courseId])       // fast lookup by PH ID within a course
}

enum EnrollmentStatus {
  active
  completed
  dropped
}
```

**`Course` model** — add `slug` (unique, URL-friendly), remove nothing critical. Add a back-relation to `Batch` and `Enrollment`:

```prisma
// ── MODIFIED: Course
model Course {
  // existing fields stay...
  slug        String    @unique   // NEW — used in URLs and queries

  batches     Batch[]             // NEW
  enrollments Enrollment[]        // NEW

  // Remove: participations, reports (dropping those models)
}
```

**`CourseProgress` — STRIPPED to computed-only fields:**

```prisma
// ── MODIFIED: CourseProgress (no more denormalized counts)
model CourseProgress {
  id               String    @id @default(cuid())
  status           String    @default("not_started")
  isCertified      Boolean   @default(false)
  lastActivityDate DateTime?
  completionDate   DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  userId   String
  courseId String

  user   User   @relation("UserCourseProgress", fields: [userId], references: [id])
  course Course @relation("CourseCourseProgress", fields: [courseId], references: [id])

  @@unique([userId, courseId])
  @@index([courseId, status])
}
// totalLessons, totalQuizzes, completedLessons, etc. are now computed
// at query time via aggregations — NOT stored here
```

---

## Part 3: Data Flow Redesign

### Student login flow

1. NextAuth JWT callback fires — reads `userId`, `role`, `isProfileComplete` as before.
2. On first load of the student dashboard, `layout.js` (RSC) calls `getStudentWithEnrollments(userId)` — a single Prisma query joining `Student → Enrollment → Course + Batch`.
3. The result is passed as props into `UserDataProvider`, eliminating the current `useEffect` fetch chain.
4. Each enrollment carries `{ courseId, batchId, phStudentId, status }` — the student's complete identity context for that course.

### Course access control

Access is now gated by `Enrollment.status === 'active'` AND `Enrollment.courseId === requestedCourseId`. The middleware check becomes:

```ts
// queries/enrollment.ts
export async function getActiveEnrollment(userId: string, courseId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return null;

  return prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId } },
    include: { batch: true }
  });
}
```

If `null` is returned, the RSC page redirects to `/enroll/[courseId]`. No client-side guard needed.

### Quiz submission scoped to enrollment

`QuizSubmission` gains `enrollmentId` as a foreign key (replacing the loose `courseId` + `userId` pair). This makes every submission traceable to a specific batch context:

```prisma
model QuizSubmission {
  // existing fields...
  enrollmentId String              // NEW — ties submission to batch + phStudentId context
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id])
}
```

### `phStudentId` usage

It surfaces in three places: the student's per-course profile card, admin/instructor rosters filtered by batch, and certificate `snapshotData`. It is never used as a database lookup key alone — always paired with `courseId`.

---

## Part 4: Server Actions Restructure

All inline-edit API routes (`PATCH /api/courses/[id]`) are migrated to Server Actions. The `createSafeAction` factory from document 3 is adopted verbatim as the base. Here are the enrollment-specific actions:

```ts
// app/actions/enrollment.ts
"use server";
import { z } from "zod";
import { createSafeAction } from "./safe-action";
import { prisma } from "@/lib/prisma";

const enrollSchema = z.object({
  courseId:    z.string().cuid(),
  batchId:     z.string().cuid(),
  phStudentId: z.string().min(1).max(20),
});

export const enrollStudentAction = createSafeAction(
  enrollSchema,
  async (input, userId) => {
    const student = await prisma.student.findUniqueOrThrow({ where: { userId } });

    // Guard: no duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: input.courseId } }
    });
    if (existing) throw new Error("Already enrolled in this course");

    // Guard: batch belongs to this course
    const batch = await prisma.batch.findFirstOrThrow({
      where: { id: input.batchId, courseId: input.courseId }
    });

    return prisma.enrollment.create({
      data: {
        studentId:   student.id,
        courseId:    input.courseId,
        batchId:     batch.id,
        phStudentId: input.phStudentId,
      }
    });
  },
  { tag: "enrollments" }
);
```

```ts
// app/actions/batch.ts — instructor creates batches per course
const batchSchema = z.object({
  courseId:  z.string().cuid(),
  name:      z.string().min(1).max(50),
  startDate: z.coerce.date().optional(),
  status:    z.enum(["upcoming", "active", "completed"]).default("upcoming"),
});

export const createBatchAction = createSafeAction(
  batchSchema,
  async (input, userId) => {
    // confirm caller owns the course
    const course = await prisma.course.findFirstOrThrow({
      where: { id: input.courseId, userId }
    });
    return prisma.batch.create({ data: { ...input } });
  },
  { tag: `batches-${batchSchema.shape.courseId}` }
);
```

**Cache invalidation tags used throughout:**

| Tag | Invalidated by |
|---|---|
| `enrollments` | `enrollStudentAction`, `dropEnrollmentAction` |
| `course-batches-[id]` | `createBatchAction`, `updateBatchAction` |
| `student-dashboard` | Any enrollment status change |
| `course-roster-[id]` | Enrollment create/drop |

---

## Part 5: Hook & Client Architecture

### Replace `useEffect` fetching

The current `UserDataProvider` uses `useEffect` to fetch the profile. After migration, `layout.js` becomes:

```tsx
// app/(main)/layout.tsx — RSC
import { getStudentWithEnrollments } from "@/queries/student";
import { UserDataProvider } from "@/provider/UserDataProvider";
import { auth } from "@/lib/auth";

export default async function Layout({ children }) {
  const session = await auth();
  const userData = session?.user ? await getStudentWithEnrollments(session.user.id) : null;

  return (
    <UserDataProvider initialData={userData}>
      {children}
    </UserDataProvider>
  );
}
```

`UserDataProvider` becomes a trivial context provider with no `useEffect`:

```tsx
"use client";
export function UserDataProvider({ children, initialData }) {
  return <UserContext.Provider value={initialData}>{children}</UserContext.Provider>;
}
```

### Enrollment-specific hooks

```ts
// hooks/queries/useStudentEnrollments.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getStudentEnrollments } from "@/queries/enrollment";

export function useStudentEnrollments(initialData) {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: getStudentEnrollments,
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}
```

```ts
// hooks/queries/useCourseBatches.ts
export function useCourseBatches(courseId: string, initialData?) {
  return useQuery({
    queryKey: ["course-batches", courseId],
    queryFn: () => getCourseBatches(courseId),
    initialData,
  });
}
```

```ts
// hooks/crud/useEnrollStudent.ts
import { createMutationWithToast } from "../factory/createMutationWithToast";
import { enrollStudentAction } from "@/app/actions/enrollment";

export const useEnrollStudent = createMutationWithToast(enrollStudentAction);

// Usage:
// const { mutateAsync } = useEnrollStudent({ invalidate: ["enrollments"], successMessage: "Enrolled!" });
```

---

## Part 6: Migration Plan — Strict Execution Order

### Step 1 — Database migration

**Risk: HIGH. Cannot be rolled back without data loss.**

```bash
# 1. Back up production DB
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Add new models (additive only — no drops yet)
npx prisma migrate dev --name add_batch_enrollment

# 3. Backfill script: create one Batch per course, enroll existing students
```

```ts
// scripts/backfill-enrollments.ts
async function backfill() {
  const courses = await prisma.course.findMany({ include: { courseProgress: { include: { user: true } } } });

  for (const course of courses) {
    const batch = await prisma.batch.create({
      data: { name: "Batch 1", courseId: course.id, status: "active" }
    });

    for (const cp of course.courseProgress) {
      const student = await prisma.student.findUnique({ where: { userId: cp.userId } });
      if (!student) continue;

      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        create: {
          studentId:   student.id,
          courseId:    course.id,
          batchId:     batch.id,
          phStudentId: `PH-${student.idNumber ?? student.id.slice(0, 8)}`,
        },
        update: {}
      });
    }
  }
}
```

After verifying backfill integrity, run a second migration to drop deprecated fields:

```bash
npx prisma migrate dev --name remove_deprecated_fields
# Drops: Student.idNumber, Student.session, Student.department
# Drops: CourseProgress denormalized count columns
# Drops: Participation, Report models
```

**Rollback**: restore from `pg_dump` file. The additive migration (step 2) can be reversed with `prisma migrate reset` on dev, but not on prod without the backup.

---

### Step 2 — Backend (queries and actions)

Order matters here because RSC pages depend on queries:

1. Add `queries/enrollment.ts`, `queries/batch.ts` — new read functions.
2. Add `app/actions/enrollment.ts`, `app/actions/batch.ts`.
3. Migrate existing inline API PATCH routes to Server Actions — starting with `title-form`, `description-form`, etc. in `instructor-dashboard`.
4. Update `queries/course.ts` to remove references to `Participation` and `Report`.
5. Update `CourseProgress` queries to compute progress from `LessonProgress` aggregations instead of stored counts.

---

### Step 3 — Frontend (hooks and components)

1. Refactor `UserDataProvider` to accept `initialData` prop (no `useEffect`).
2. Update `layout.js` to pass RSC-fetched data.
3. Add `useStudentEnrollments`, `useCourseBatches`, `useEnrollStudent` hooks.
4. Build enrollment dashboard component showing all courses × batches.
5. Update course access guards to check `Enrollment` instead of `CourseProgress.status`.
6. Instructor batch management UI: `BatchForm`, `BatchRoster` components.

---

### Step 4 — Rollback strategy per layer

| Layer | Rollback method |
|---|---|
| DB schema (additive) | `prisma migrate reset` on dev; pg_dump restore on prod |
| DB (destructive drops) | pg_dump restore only — no Prisma rollback for drops |
| Server actions | Git revert — stateless, no side effects |
| Frontend hooks | Git revert — no DB impact |
| Cache tags | Manual `revalidateTag` call or cache flush |

---

## Part 7: Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| Backfill assigns wrong `phStudentId` | High | Run in a transaction; log all mappings; allow manual correction post-migration |
| Existing `QuizSubmission` rows orphaned after adding `enrollmentId` (nullable transition) | Medium | Make `enrollmentId` nullable initially; backfill via `userId + courseId`; then add NOT NULL constraint |
| `CourseProgress` progress % breaks if computed queries are slow | Medium | Add `@@index([userId, lessonId])` on `LessonProgress`; add Redis cache for progress aggregation if needed |
| Instructor forms break when API routes are removed before Server Actions land | High | Feature-flag migration: run API routes in parallel with new actions, cut over per-form |
| `Student.idNumber` removal breaks existing auth JWT (if stored in token) | Medium | Audit JWT callback — if `idNumber` is in token payload, remove from callback before DB drop |
| Dual enrollment attempt (race condition on `@@unique([studentId, courseId])`) | Low | Prisma unique constraint throws `P2002`; wrap `enrollStudentAction` in try/catch on that code |
| `phStudentId` assumed globally unique in admin search | Medium | Admin search must always filter by `courseId` alongside `phStudentId` — document this in query layer |

---

## Part 8: Performance & Scalability

### Enrollment dashboard query (no N+1)

```ts
// queries/student.ts — single query, no waterfalling
export async function getStudentWithEnrollments(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        where: { status: "active" },
        include: {
          course:  { select: { id: true, title: true, slug: true, thumbnail: true } },
          batch:   { select: { id: true, name: true, status: true } },
        },
        orderBy: { enrolledAt: "desc" }
      }
    }
  });
}
```

This replaces the current pattern where `CourseProgress` was fetched separately per course.

### Index additions for the new schema

```prisma
// On Enrollment — critical for roster and access checks
@@index([courseId, batchId])
@@index([phStudentId, courseId])

// On Batch — instructor batch management
@@index([courseId, status])

// On LessonProgress — progress computation (replaces denormalized counts)
@@index([userId, status])           // already exists
@@index([lessonId, status])         // NEW — for per-lesson completion rates
```

### Caching strategy

`unstable_cache` tags for the new entities:

```ts
export const getCourseBatches = unstable_cache(
  async (courseId: string) => prisma.batch.findMany({ where: { courseId }, orderBy: { name: "asc" } }),
  ["course-batches"],
  { tags: [`course-batches-${courseId}`], revalidate: 300 }
);
```

Progress computation is the most expensive new query. If the aggregation (`COUNT(LessonProgress WHERE status = 'completed')`) becomes a bottleneck under load, introduce a lightweight materialized view or a Redis key updated by the `completeLessonAction` Server Action — this defers the architectural complexity until it's actually needed.

---

**Key decision summary:** `phStudentId` is enrollment-scoped, never globally unique. `Batch` belongs to `Course`, not `Student`. All mutations flow through typed Server Actions with Zod on both client and server. `useEffect` data-fetching is fully eliminated by RSC prop injection into providers. The migration executes strictly additive-first, destructive-second, with a full pg_dump before any destructive step.