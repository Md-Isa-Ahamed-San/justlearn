# Project Context: JUSTLearn LMS

## 1. Project Overview
- **Purpose**: A comprehensive, scalable Learning Management System (LMS) tailored for modern education focusing on students, instructors, and admins.
- **Core features**: Role-based access, interactive courses, AI-generated quizzes, strict anti-cheating measures, gamification (badges/points), certificates, and scheduling for live sessions.
- **Tech stack**:
  - *Frontend*: Next.js 15 (App Router), React 18, Tailwind CSS, Framer Motion, Radix UI primitives.
  - *Backend*: Next.js Server Actions, Next.js API Routes (REST-like), NextAuth.js v5.
  - *Database*: PostgreSQL managed via Prisma ORM v6.
  - *Tools & Integrations*: Groq SDK (AI tutoring/generation), Cloudinary (media upload), Resend (emails). `stripe`, `mongodb`, and `@react-pdf` remain in `package.json` as unused "ghost" dependencies.
- **Architecture style**: Modern Serverless Monolith utilizing React Server Components (RSC). Employs a hybrid mutation architecture, splitting logic between direct Server Actions and traditional API Route fetches.

---

## 2. Folder & Module Structure

```text
justlearn/
├── app/                  # Next.js App Router root
│   ├── (main)/           # Public and student-facing pages wrapped in a layout
│   ├── admin-dashboard/  # Admin-only restricted routes
│   ├── instructor-dashboard/ # Instructor-only restricted routes
│   ├── actions/          # Server Actions for Data Mutations
│   └── api/              # API Endpoints (e.g., RESTful PATCH routes, external webhooks)
├── components/           # Reusable functional UI components & specialized forms
├── hooks/                # Specialized custom React hooks encapsulating complex logic
├── provider/             # React Context Providers (UserDataProvider, ThemeProvider)
├── queries/              # Encapsulated Prisma read operations with unstable_cache
├── lib/                  # Configurations (Prisma instance, NextAuth, Resend emails)
├── utils/                # Small pure functions (e.g., uploadToCloudinary.js)
└── prisma/               # Schema definitions and migrations
```
- **Responsibility & Separation of Concerns**: Highly decoupled reads/writes. `queries/` handles reads, `actions/` and `api/` handle mutations, `app/` routes, and `components/` handle UI.

---

## 3. Detailed Database Schema (CRITICAL)

### Core User Models
| Model / Field | Type | Default | Constraints |
|---------------|------|---------|-------------|
| **User** | | | *Base auth model* |
| id | String | `cuid()` | Primary Key |
| name, email | String | | Unique (email), Required |
| role | Enum(Role) | | student, instructor, admin |
| points | Int | 0 | Required |
| isActive, isProfileComplete | Boolean | true, false | Required |
| **Student / Instructor / Admin** | | | *1-1 mapped to User via `userId`* |
| userId | String | | Foreign Key, Unique |
| idNumber | Int | | Unique, Required |
| department, bio, phone | String | | Required / Nullable |

### Course & Hierarchy Models
| Model / Field | Type | Default | Constraints |
|---------------|------|---------|-------------|
| **Category** | | | *1-N with Course* |
| id, title, thumbnail | String | `cuid()` | PK, Required |
| **Course** | | | *Main Entity* |
| id, title, description, code | String | `cuid()` | PK, Required |
| userId | String | | FK to User (Instructor), Indexed |
| categoryId | String | | FK to Category, Indexed |
| active, isCompleted | Boolean| true, false | Required |
| visibility | Enum | public | public, private |
| **Week** | | | *1-N with Lesson, N-N with Quiz* |
| id, title, description| String | `cuid()` | PK, Required |
| courseId | String | | FK to Course, Cascade Delete |
| order | Int | | Required |
| **Lesson** | | | *1-N with Week* |
| id, title, videoUrl | String | `cuid()` | PK, Nullable (videoUrl) |
| weekId | String | | FK to Week |

### Assessment Models
| Model / Field | Type | Default | Constraints |
|---------------|------|---------|-------------|
| **Quiz** | | | *Assessment Config* |
| id, title, description | String | `cuid()` | PK, Required |
| createdByUserId | String | | FK to User |
| securityLevel | Enum | medium| low, medium, high |
| blockCopyPaste, blockTab...| Boolean| true | Anti-cheat config required |
| **WeekQuiz (Join Table)**| | | *N-N mapping Week & Quiz* |
| weekId, quizId | String | | FKs to Week and Quiz (Unique pair) |
| **Question**| | | *1-N with Quiz* |
| quizId | String | | FK to Quiz |
| text, correctAnswer | Str, Json| | Required |

### Activity & Gamification
| Model / Field | Type | Default | Constraints |
|---------------|------|---------|-------------|
| **CourseProgress** | | | *Progress Tracker* |
| userId, courseId | String | | FKs to User, Course (Unique pair) |
| status | String | not_started| not_started, in_progress, completed |
| progress, totalLessons..| Float, Int| 0 | Computed Aggregates |
| **QuizSubmission** | | | *Quiz Tracker* |
| userId, quizId, courseId | String | | FKs to User, Quiz, Course |
| score, attemptNumber | Float, Int | 0, 1 | |
| **Badge / UserBadge** | | | *Gamification* |
| badgeId, userId | String | | FKs resolving N-N relation |

- **Normalization Issues**: `CourseProgress` stores duplicated denormalized counts (`totalWeeks`, `totalLessons`, `totalQuizzes`) to facilitate fast reads without heavy aggregation. Requires meticulous synchronization during mutations elsewhere. 
- **Missing Constraints**: Deletion logic on instructor side often omits cascading directives, potentially producing orphaned relations if lessons are deleted manually.
- **Indexing Strategy**: Uses robust compound constraints (`@@unique([userId, courseId])`). `QuizSubmission` would benefit from an index encompassing `[userId, quizId, createdAt]` to accelerate recent attempt checks.

---

## 4. Authentication & Authorization Flow
- **Auth System**: NextAuth v5 (Auth.js) combined with Next.js Middleware.
- **Session Strategy**: Custom JWT implementation holding `userId`, `role`, and `isProfileComplete`. The JWT callback actively synchronizes role updates with the DB state to immediately apply permission changes.
- **Role handling**: Strict separation (`student`, `instructor`, `admin`) enforced by `middleware.js` blocking unauthorized segments (e.g., intercepting `/instructor-dashboard`).
- **Middleware Protection**: Forces role assignment (`/roleSelection`) and profile completion (`/profile-completion`) routing before allowing deeper navigation ensuring onboarding flows are never skipped.
- **Server Actions**: Independently grab `auth()` session to dynamically prevent impersonation payloads via `await getLoggedInUser()`, rather than trusting client IDs.

---

## 5. API / Server Layer
- **API Routes (`app/api/...`)**: Powers REST-like partial updates from the UI. `Instructor-dashboard` components like `title-form.jsx` execute `fetch('/api/courses/[id]', { method: 'PATCH' })` relying on APIs instead of Server Actions for standard inline edits.
- **Server Actions (`app/actions/...`)**: Manage intense, transactional mutations (`deleteLesson`, `createLiveSession`) and trigger heavy cache purges, shielding complex queries from the frontend.
- **Business Logic**: Segmented into Server Actions and API Routes, ensuring Client Components are entirely focused on UI state handling and form resolution.

---

## 6. Server Action Pattern
- **Standard Structure**: Relies on `try...catch`. Typical response is `{ success: true, data: ... }` on resolution, and `{ success: false, error: "String Message" }` on failure.
- **Validation Approach**: Manual null-checks (`if (!data.weekId)`) dominate the `app/actions` layer. Type-safe `Zod` validation is absent on the Server layer, risking bypassing if API calls are spoofed.
- **Error Handling**: Hardcoded string returns. Errors are not categorized or routed to a centralized handler/logger making complex failure tracking ambiguous.
- **Cache Revalidation**: Frequently manipulates `revalidatePath('/instructor-dashboard/courses/[id]')` and `revalidateTag("completed-lessons")` to manually purge RSC caches preventing stale views post-mutation.

---

## 7. Data Flow (VERY IMPORTANT)

There are two primary mutation pathways:

**A. Server Action Flow (Heavy Logic, e.g., Submit Quiz)**
1. Client Interactive Component → Invokes Server Action function locally.
2. Server Action validates session (`auth()`) → Mutates Data (Prisma) → Revalidates Tags.
3. Server returns success object → React updates internal state (optimistic) and streams new RSC payload.

**B. API Route Flow (Inline Editing, e.g., Title Form)**
1. User enters data locally → Zod Schema intercepts/validates locally.
2. Component triggers `fetch('/api/courses/[courseId]', { method: "PATCH" })`.
3. API validates session → Mutates Data → returns `200 OK`.
4. Client executes `router.refresh()` to force RSC payload reload and sync the view.

---

## 8. State Management Analysis
- **Server State**: Next.js Data Cache holding the foundational layout/page contexts.
- **Client Global State**: `UserDataProvider` Context, which holds DB profiles. Uses deep `useEffect` chains to asynchronously fetch profiles despite having an RSC framework capable of streaming it directly.
- **Client Local State**: Extremely robust custom Hooks managing segmented complex tasks (e.g., `useQuizState` isolating anti-cheat DOM listeners).

---

## 9. Hooks & Reusability
- **Existing Custom Hooks**: 
  - `useQuizState`: Manages status (`in_progress`, `submitting`, `error`).
  - `useViolationHandler`: Tracks copy/paste tab switching for security.
- **Missing Abstractions**: Standardized Data Fetching logic (e.g. SWR) is missing. Pagination often relies on direct API calls rather than standardized hooks.
- **Duplication Areas**: Repetitive `toast.error(error.message)` handling exists across almost every `_components/X-form.jsx` file utilizing similar API calling logic.

---

## 10. Component Architecture
- **Smart vs Dumb Pattering**: Executed well. `page.js` Server Components perform data fetching via `unstable_cache` passing the explicit data downwards into small, encapsulated Client Components (`title-form.jsx`, `description-form.jsx`).
- **Prop Drilling**: Addressed utilizing small components accessing properties passed directly from their parent `page.js` component payload.
- **Re-render Risks**: Form sub-components managing their own `useState` (`isEditing`, `isSubmitting`) prevents massive parent-level re-renders during inline text editing. 

---

## 11. Form Handling Pattern
- **Validation**: High utilization of `react-hook-form` and `@hookform/resolvers/zod` within `app/instructor-dashboard/.../_components/`. Zod handles immediate schema validation on the client enforcing strict bounds (e.g., `min(1)`).
- **Submission**: Controlled by `handleSubmit(onSubmit)`. Typically executes a `fetch` payload to `/api/...`, captures the response, toggles the local `isEditing` state, and runs `toast.success()`. 
- **Loading UI**: Disables buttons utilizing the `isSubmitting` flag built into `react-hook-form`.

---

## 12. Pagination, Filtering & Data Fetching
- **Pagination Type**: **Offset-based** Pagination heavily leaning on Prisma's `skip` and `take` (`take: limit, skip: (page-1) * limit`), primarily exposed in `queries/users.js` logic.
- **Filtering Approach**: Processed Server-side utilizing complex nested `OR` conditionals searching dynamically across relations. 
- **Client Fetching vs Server Fetching**: Initial rendering entirely serverside. Successive searches often rely on URL query param updates forcing an RSC reload rather than client-rendered arrays.

---

## 13. Caching Strategy
- **`unstable_cache` Usage**: Foundation of the `queries/` directory. Dramatically reduces DB throughput for high-volume content.
- **Cache Tags**: Leverages descriptive tracking keys (`["all-courses"]`, `["course-details", id]`).
- **Revalidation**: Dependent on manual On-Demand purging. Server Actions directly name paths `revalidatePath('/courses/[id]')` following successful Prisma manipulations to ensure eventual consistency. 

---

## 14. Performance Analysis
- **Unnecessary Re-renders**: Blocked by splitting giant views into heavily isolated client sub-forms. 
- **Heavy Queries / Over-fetching**: Resolving deeply nested data (e.g., a Course injecting all Weeks, injecting all Lessons, injecting all User Participations) within a single query places heavy payload strains on the RSC engine.
- **Blocking Tasks**: `Promise.all` mitigates waterfalling in components like `courses/[id]/page.js`.

---

## 15. File Upload / Media Handling
- **Upload Flow**: Proxied directly to media hosting via `utils/uploadToCloudinary.js`.
- **Interface**: Implemented on the frontend via `react-dropzone` mimicking progress bars.
- **Security**: Because files pass directly via `FormData` client-to-Cloudinary, Server limits (payload size config) are bypassed, reliant entirely on Cloudinary preset rules to stop massive file abuse.

---

## 16. Real-time / Live Features
- **Live Classes**: Managed identically as standard content utilizing the `Live` Schema mapping (`date`, `time`, `meetLink`).
- **Implementation Methodology**: Completely asynchronous relying on scheduling flags rather than persistent WebSocket infrastructure. Users interact by navigating to the linked third-party (`meetLink`) preventing local scaling concerns.

---

## 17. Error Handling Strategy
- **Current Approach**: Explicitly manual interception (`try/catch`). 
- **Problems**: Fails to sanitize technical exceptions; raw error texts percolate exactly as generated out to `toast.error(...)` components exposing internal architectures. There is no unified `AppError` parser to classify 400 vs 500 level failures cleanly on APIs.

---

## 18. Anti-patterns
- **Asymmetric Validation Engine**: Tight schema validation on the Client (`Zod`) while relying entirely on implicit manual checks on the Server (`Actions`, `API`), risking backend faults on spoofed requests.
- **Ghost Dependencies**: Bundler remains burdened by unused dependencies (`mongodb`, `stripe`, `@react-pdf`) adding false assumptions to the tech footprint.
- **Dual Flow Architecture**: Splitting mutations randomly between `Server Actions` (for deleting) and `API Routes` (for inline editing) complicates maintaining unified routing patterns.

---

## 19. Improvement Opportunities (NO CODE)
- **Centralize Validations**: Move all Zod schemas into a shared `lib/validations.js`. Execute the exact same schema on the form component AND inside the Server Action/API before allowing DB access. 
- **Unified Action Flow**: Migrate all REST-like `API patch` operations nested inside `instructor-dashboard/_components` to standardized NextJS Server Actions to entirely eliminate context switching and standardise `revalidatePath` mechanics.
- **Remove API Driven Contexts**: Refactor `UserDataProvider` to consume its default value via an RSC payload prop injected from `layout.js` entirely circumventing the `useEffect()` load boundary populating immediately.
