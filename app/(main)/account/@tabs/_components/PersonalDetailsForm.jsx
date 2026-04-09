"use client";

import {
  Mail,
  Briefcase,
  FileText,
  Phone,
  Save,
  Lock,
  User,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ProfilePicture from "../../_component/ProfilePicture";
import FormField from "../../_component/FormField";
import SocialMediaField from "../../_component/SocialMediaField";
import { toast } from "sonner";
import { handlePersonalDetails } from "../../../../actions/formActions";
import { useState } from "react";
import { uploadToCloudinary } from "../../../../../utils/uploadToCloudinary";

export default function PersonalDetailsForm({ userData, academicSessions }) {
  const role = userData?.role;
  const email = userData?.email;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  let userRoleData = null;
  if (role === "instructor") {
    userRoleData = userData?.instructor;
  } else if (role === "student") {
    userRoleData = userData?.student;
  } else if (role === "admin") {
    userRoleData = userData?.admin;
  }
  const handleEditClick = (event) => {
    event.preventDefault();
    setIsEditing(true);
  };
  const handleCancelClick = (event) => {
    event.preventDefault();
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    setIsSubmitting(true);
    e.preventDefault();
    const formData = new FormData(e.target);

    const socialFields = [
      "linkedin",
      "facebook",
      "github",
      "googleScholar",
      "personalWebsite",
    ];
    const hasSocialMedia = socialFields.some((field) =>
        formData.get(field)?.trim()
    );

    if (!hasSocialMedia) {
      toast.error("Please fill in at least one social media profile.");
      setIsSubmitting(false);
      return;
    }

    try {
      const profilePicture = formData.get("profilePicture");
      let profilePictureLink = null;

      if (profilePicture && profilePicture.size > 0) {
        profilePictureLink = await uploadToCloudinary(profilePicture);
      }

      formData.set("profilePicture", profilePictureLink || "");
      formData.set("email", email);
      formData.set("role", role); // Ensure role is passed

      const result = await handlePersonalDetails(formData);

      if (result.success) {
        toast.success("Details updated successfully.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update details.");
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="bg-card">
        <div className="space-y-6">
          <ProfilePicture
              src={userData?.image}
              alt="Profile"
              fallback={
                  userData?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"
              }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
                id="name"
                name="name"
                label="Full Name *"
                placeholder="Enter your full name"
                defaultValue={userData?.name}
                disabled={!isEditing}
                required
                icon={<User />}
            />

            <div className="space-y-2">
              <label
                  htmlFor="email"
                  className="text-foreground font-poppins font-bold text-sm flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Address
                <Lock className="h-3 w-3 text-muted-foreground" />
              </label>
              <input
                  id="email"
                  type="email"
                  value={email || ""}
                  readOnly
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm cursor-not-allowed opacity-60 text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <FormField
                id="phone"
                name="phone"
                label="Phone Number *"
                type="tel"
                placeholder="Enter your phone number"
                defaultValue={userRoleData?.phone}
                required
                disabled={!isEditing}
                icon={<Phone />}
            />

            <FormField
                id="idNumber"
                name="idNumber"
                label="ID Number *"
                type="number"
                placeholder="Enter your ID number"
                defaultValue={userRoleData?.idNumber}
                required
                disabled={!isEditing}
                icon={<FileText />}
            />

            <div className="space-y-2">
              <label htmlFor="department" className="text-foreground font-poppins font-bold text-sm">
                Department *
              </label>
              <Select
                  name="department"
                  defaultValue={userRoleData?.department || ""}
                  required
                  disabled={!isEditing}
              >
                <SelectTrigger className={`bg-input border-border text-foreground ${!userRoleData?.department ? "text-muted-foreground" : "text-foreground"}`}>
                  <SelectValue
                      placeholder="Select department"
                      className="text-muted-foreground"
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {[
                    "Computer Science",
                    "Mathematics",
                    "Physics",
                    "Chemistry",
                    "Biology",
                    "Engineering",
                  ].map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-popover-foreground">
                        {dept}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(role === "instructor" || role === "admin") && (
                <FormField
                    id="designation"
                    name="designation"
                    label="Designation *"
                    placeholder={
                      role === "instructor"
                          ? "e.g., Associate Professor"
                          : "e.g., System Administrator"
                    }
                    defaultValue={userRoleData?.designation}
                    required
                    disabled={!isEditing}
                    icon={<Briefcase />}
                />
            )}

            {role === "student" && (
                <div className="space-y-2">
                  <label htmlFor="session" className="text-foreground font-poppins font-bold text-sm">
                    Academic Session *
                  </label>
                  <Select
                      name="session"
                      defaultValue={userRoleData?.session || ""}
                      required
                      disabled={!isEditing}
                  >
                    <SelectTrigger className={`bg-input border-border text-foreground ${!userRoleData?.session ? "text-muted-foreground" : "text-foreground"}`}>
                      <SelectValue
                          placeholder="Select session"
                          className="text-muted-foreground"
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {academicSessions.map((session) => (
                          <SelectItem key={session} value={session} className="text-popover-foreground">
                            {session}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            )}

            <FormField
                id="bio"
                name="bio"
                label="Bio *"
                placeholder="Tell us about yourself"
                defaultValue={userRoleData?.bio}
                required
                isTextarea
                icon={<FileText />}
                disabled={!isEditing}
                className="sm:col-span-2 lg:col-span-3"
            />
          </div>

          {/* Social Media */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-poppins font-bold text-foreground mb-2">Social Profiles *</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Fill in at least one social media profile
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SocialMediaField
                  id="linkedin"
                  name="linkedin"
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  defaultValue={userRoleData?.socialMedia?.linkedin}
                  disabled={!isEditing}
              />
              <SocialMediaField
                  id="facebook"
                  name="facebook"
                  label="Facebook"
                  placeholder="https://facebook.com/username"
                  defaultValue={userRoleData?.socialMedia?.facebook}
                  disabled={!isEditing}
              />
              <SocialMediaField
                  id="github"
                  name="github"
                  label={role === "student" ? "GitHub (Recommended)" : "GitHub"}
                  placeholder="https://github.com/username"
                  defaultValue={userRoleData?.socialMedia?.github}
                  disabled={!isEditing}
              />
              {role === "instructor" && (
                  <SocialMediaField
                      id="researchGate"
                      name="researchGate"
                      label="Research Gate"
                      placeholder="https://researchgate.net/profile/name"
                      defaultValue={userRoleData?.socialMedia?.researchGate}
                      disabled={!isEditing}
                  />
              )}
              {role === "instructor" && (
                  <SocialMediaField
                      id="googleScholar"
                      name="googleScholar"
                      label="Google Scholar"
                      placeholder="https://scholar.google.com/citations?user=name"
                      defaultValue={userRoleData?.socialMedia?.googleScholar}
                      disabled={!isEditing}
                  />
              )}
              {role === "instructor" && (
                  <SocialMediaField
                      id="personalWebsite"
                      name="personalWebsite"
                      label="Personal Website"
                      placeholder="https://personalWebsite.com"
                      defaultValue={userRoleData?.socialMedia?.personalWebsite}
                      disabled={!isEditing}
                  />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {isEditing === true ? (
                <>
                  <Button
                      type="submit"
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Save Changes"}
                  </Button>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelClick}
                      className="gap-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </Button>
                </>
            ) : (
                <Button
                    onClick={handleEditClick}
                    type="button"
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
            )}
          </div>
        </div>
      </form>
  );
}