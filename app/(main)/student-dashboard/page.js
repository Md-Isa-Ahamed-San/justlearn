import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { db } from "@/lib/prisma";
import {
    ArrowRight,
    BookOpen,
    Calendar,
    Clock,
    PlayCircle,
    Star,
    Trophy
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getStudentData(userId) {
    const [enrolledCourses, liveSessions, userBadges] = await Promise.all([
        db.course.findMany({
            where: {
                courseProgress: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                courseProgress: {
                    where: { userId: userId }
                },
                weeks: {
                    include: {
                        lessons: true
                    }
                },
                user: true
            }
        }),
        db.live.findMany({
            where: {
                schedule: {
                    gte: new Date()
                }
            },
            orderBy: {
                schedule: 'asc'
            },
            take: 3,
            include: {
                user: true
            }
        }),
        db.userBadge.findMany({
            where: { userId: userId },
            include: { badge: true }
        })
    ]);

    return { enrolledCourses, liveSessions, userBadges };
}

export default async function StudentDashboardPage() {
    const user = await getLoggedInUser();

    if (!user) redirect("/login");
    if (user.role !== "student") redirect("/");

    const { enrolledCourses, liveSessions, userBadges } = await getStudentData(user.id);

    // Calculate stats
    const totalPoints = user.points || 0;
    const completedCourses = enrolledCourses.filter(c => c.courseProgress[0]?.status === 'completed').length;
    const inProgressCourses = enrolledCourses.filter(c => c.courseProgress[0]?.status === 'in_progress').length;

    return (
        <div className="p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                    <p className="text-muted-foreground mt-1">
                        You&apos;ve learned a lot this week. Keep it up!
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Points</p>
                                <p className="text-xl font-bold text-primary">{totalPoints}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courses in Progress</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressCourses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedCourses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                        <AwardIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userBadges.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Enrolled Courses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <PlayCircle className="w-5 h-5" />
                            Continue Learning
                        </h2>
                        <Link href="/account/progress" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {enrolledCourses.length > 0 ? (
                            enrolledCourses.map(course => {
                                const progress = course.courseProgress[0];
                                const totalLessons = course.weeks.reduce((acc, week) => acc + week.lessons.length, 0);
                                const completedLessons = progress?.completedLessonIds?.length || 0;
                                const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                                return (
                                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-0 flex flex-col md:flex-row">
                                            <div className="relative w-full md:w-48 h-32 md:h-auto">
                                                <Image
                                                    src={course.thumbnail || "/placeholder-course.jpg"} 
                                                    alt={course.title}
                                                    className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                                                />
                                            </div>
                                            <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                                                        {progress?.status === 'completed' && (
                                                            <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                Completed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {course.user?.name ? `By ${course.user.name}` : 'Instructor'}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{percent}% Complete</span>
                                                        <span>{completedLessons}/{totalLessons} Lessons</span>
                                                    </div>
                                                    <Progress value={percent} className="h-2" />
                                                </div>
                                                
                                                <div className="pt-2">
                                                    <Link href={`/courses/${course.id}`}>
                                                        <Button size="sm" className="w-full md:w-auto">
                                                            {progress?.status === 'not_started' ? 'Start Learning' : 'Continue Learning'}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-8 text-center space-y-4">
                                    <div className="p-3 bg-background rounded-full w-fit mx-auto">
                                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">No courses yet</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Browse our catalog and enroll in your first course!
                                        </p>
                                    </div>
                                    <Link href="/courses">
                                        <Button>Browse Courses</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Sidebar - Live Sessions & Badges */}
                <div className="space-y-6">
                    {/* Live Sessions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Upcoming Lives
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {liveSessions.length > 0 ? (
                                liveSessions.map(session => (
                                    <div key={session.id} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                                        <div className="bg-primary/10 text-primary p-2 rounded text-center min-w-[3rem]">
                                            <div className="text-xs font-bold uppercase">
                                                {new Date(session.schedule).toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                            <div className="text-lg font-bold leading-none">
                                                {new Date(session.schedule).getDate()}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm line-clamp-1">{session.title}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(session.schedule).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {session.meetLink && (
                                                <a 
                                                    href={session.meetLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline block mt-1"
                                                >
                                                    Join Meeting
                                                </a>
                                            )}
                                            {session.videoId && (
                                                <a
                                                    href={session.videoId}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-green-600 hover:underline block mt-1"
                                                >
                                                    📹 Watch Recording
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No upcoming live sessions.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Badges */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AwardIcon className="w-5 h-5" />
                                Recent Badges
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userBadges.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {userBadges.slice(0, 6).map(ub => (
                                        <div key={ub.id} className="flex flex-col items-center text-center p-2" title={ub.badge.description}>
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-1 text-xl">
                                                {ub.badge.icon || "🏅"}
                                            </div>
                                            <span className="text-[10px] font-medium leading-tight">{ub.badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    <p>No badges earned yet.</p>
                                    <p className="text-xs mt-1">Complete lessons to earn badges!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function AwardIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
    )
}
