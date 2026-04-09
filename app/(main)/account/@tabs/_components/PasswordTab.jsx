"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Save, AlertCircle } from "lucide-react"
import PasswordField from "../../_component/PasswordField"

export default function PasswordTab() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your password should be at least 8 characters and include a mix of letters, numbers, and symbols.
          </AlertDescription>
        </Alert>

        <form>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField
                id="current-password"
                label="Current Password"
                placeholder="Enter your current password"
                required
              />

              <div className="sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordField
                    id="new-password"
                    label="New Password"
                    placeholder="Enter your new password"
                    required
                  />

                  <PasswordField
                    id="confirm-password"
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Password Strength</span>
                <span className="font-medium text-primary">Strong</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full w-4/5 rounded-full"></div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Update Password
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}