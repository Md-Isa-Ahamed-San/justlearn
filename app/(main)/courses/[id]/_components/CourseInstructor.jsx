
import { TabsContent } from "@/components/ui/tabs";
import { getInstructorDetailedStats } from "@/queries/courses";
import {
    BookOpen,
    Building,
    Facebook,
    Github,
    Globe,
    GraduationCap,
    Linkedin,
    Mail,
    MessageSquare,
    Phone,
    GraduationCap as Scholar,
    Star,
    Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CourseInstructor = async ({ courseDetails }) => {
  // Extract instructor data once to avoid repetition
  const instructorProfile = courseDetails?.user?.instructor;
  const userProfile = courseDetails?.user;

  // Early return if no instructor data
  if (!instructorProfile || !userProfile) {
    return (
      <TabsContent value="instructor" className="mt-6">
        <div className="p-8 text-center text-gray-500">
          No instructor information available
        </div>
      </TabsContent>
    );
  }

  // Get instructor stats
  const instructorStats = await getInstructorDetailedStats(userProfile?.id);
  // console.log("CourseInstructor ~ instructorStats:", instructorStats);

  // Extract commonly used values
  const fullName = userProfile?.name;
  const profileImage = 
    instructorProfile?.profilePicture || 
    userProfile?.image || 
    "/placeholder.svg?height=250&width=250";
  const socialMedia = instructorProfile?.socialMedia;

  // Helper function to create social media links
  const getSocialLinks = (socialMedia) => {
    if (!socialMedia || typeof socialMedia !== 'object') return [];
    
    const socialPlatforms = [
      { platform: 'LinkedIn', icon: Linkedin, key: 'linkedin' },
      { platform: 'Facebook', icon: Facebook, key: 'facebook' },
      { platform: 'GitHub', icon: Github, key: 'github' },
      { platform: 'Personal Website', icon: Globe, key: 'website' },
      { platform: 'Google Scholar', icon: Scholar, key: 'googleScholar' },
      { platform: 'ResearchGate', icon: BookOpen, key: 'researchGate' },
    ];

    return socialPlatforms
      .filter(({ key }) => socialMedia[key])
      .map(({ platform, icon, key }) => ({
        platform,
        icon,
        url: socialMedia[key]
      }));
  };

  const socialLinks = getSocialLinks(socialMedia);

  return (
    <TabsContent value="instructor" className="mt-6">
      <div className="overflow-hidden rounded-xl bg-muted/30 p-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Profile Image with Social Links */}
          <div className="flex-shrink-0 relative">
            <div className="flex flex-col">
              <Image
                src={profileImage}
                alt={fullName}
                width={250}
                height={250}
                className="rounded-xl object-cover"
                quality={50}
              />
              
              {/* Social Links - Floating over image */}
              {socialLinks.length > 0 && (
                <div className="">
                  <div className="mx-4 mt-2 flex justify-center items-center gap-2">
                    {socialLinks.map(({ platform, icon: Icon, url }) => (
                      <Link
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent  transition-all duration-200 "
                        title={`Follow on ${platform}`}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructor Details */}
          <div className="flex-1 space-y-6 mt-4 md:mt-0">
            {/* Name and Title with Social Links Alternative */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-3xl font-bold">{fullName}</h3>
                {instructorProfile?.designation && (
                  <p className="text-lg font-medium text-primary mt-1">
                    {instructorProfile?.designation}
                  </p>
                )}
              </div>
              
              {/* Alternative: Social Links next to name (uncomment if preferred) */}
              {/* {socialLinks.length > 0 && (
                <div className="flex gap-2">
                  {socialLinks.map(({ platform, icon: Icon, url }) => (
                    <Link
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
                      title={`Follow on ${platform}`}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              )} */}
            </div>

            {/* Department and Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {instructorProfile?.department && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{instructorProfile?.department}</span>
                </div>
              )}
              {instructorProfile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{instructorProfile?.phone}</span>
                </div>
              )}
              {userProfile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{userProfile?.email}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {instructorProfile?.bio && (
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="leading-relaxed">
                  {instructorProfile?.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            {instructorStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-bold text-lg">{instructorStats?.courseCount || 0}</span>
                  </div>
                  <p className="text-xs">Courses</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Users className="h-4 w-4" />
                    <span className="font-bold text-lg">{instructorStats?.totalStudents || 0}</span>
                  </div>
                  <p className="text-xs">Students</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Star className="h-4 w-4" />
                    <span className="font-bold text-lg">{instructorStats?.averageRating || 0}</span>
                  </div>
                  <p className="text-xs">Rating</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-bold text-lg">{instructorStats?.testimonialCount || 0}</span>
                  </div>
                  <p className="text-xs">Reviews</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default CourseInstructor;