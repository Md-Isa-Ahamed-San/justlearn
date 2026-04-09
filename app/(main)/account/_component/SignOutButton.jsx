"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react" // Adjust import based on your auth setup
import { LogOut } from "lucide-react"

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      
      // Call signOut with redirect: false to prevent full page reload
      await signOut({ redirect: false })
      
      // Manually redirect to home page
      router.push("/")
      router.refresh() // Refresh to update server components
      
    } catch (error) {
      console.error("❌ Error signing out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors group hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <LogOut className={`h-4 w-4 mr-3 ${isSigningOut ? 'animate-spin' : ''}`} />
      {isSigningOut ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}