"use client";

import { completeProfile } from "@/app/actions/authActions";
import { Button } from "@/components/ui/button";
import { Loader2, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileCompletionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Mark profile as complete in DB + update JWT cookie so middleware
      // won't redirect to this page again. Then navigate to account setup.
      await completeProfile("/account");
    } catch {
      // completeProfile throws a redirect — catch it and navigate manually
      router.push("/account");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-6 bg-background">
      <div className="max-w-md w-full space-y-6 text-center p-8 border rounded-xl shadow-lg bg-card">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm">
            Before you can explore the courses, please fill in your profile details.
            This helps us personalise your experience on the platform.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleContinue}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Taking you there...
              </>
            ) : (
              "Set Up My Profile →"
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can always update your profile from the account settings later.
        </p>
      </div>
    </div>
  );
}
