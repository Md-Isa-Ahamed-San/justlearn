"use client";

import { ArrowRight, CheckCircle, GraduationCap, Loader2, Shield, User } from 'lucide-react';
import { useRef, useTransition } from "react";
import { getRoleDescription } from "../../../utils/RoleHelpers";
import { submitRole } from "../../actions/authActions";

export const dynamic = 'force-dynamic'

export default function RoleSelection() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);

  const getRoleIcon = (role) => {
    switch (role) {
      case "instructor":
        return <GraduationCap className="h-5 w-5" />
      case "student":
        return <User className="h-5 w-5" />
      case "admin":
        return <Shield className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      await submitRole(formData);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 h-screen mt-8 md:mt-14 lg:mt-20">
      <div className="space-y-6">
        {/* Notice banner */}
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-300">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-sm">Role Required</p>
            <p className="text-xs mt-0.5 opacity-80">
              You must select a role before you can access the platform. Please choose below to continue.
            </p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Choose Your Role</h2>
          <p className="text-muted-foreground mt-2">
            Select the role that best describes how you will use the platform
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {["instructor", "student", "admin"].map((role) => (
              <div key={role} className="relative">
                <input
                  type="radio"
                  id={`role-${role}`}
                  name="role"
                  value={role}
                  required
                  className="peer sr-only "
                />
                <label
                  htmlFor={`role-${role}`}
                  className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer peer-checked:border-primary"
                >
                  <div className="flex-shrink-0">
                    {getRoleIcon(role)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold capitalize">{role}</h4>
                      <CheckCircle className="h-4 w-4 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getRoleDescription(role)}
                    </p>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}