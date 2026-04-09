"use client"

import { useState } from "react"
import { Users, BookOpen, Settings, Shield, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "../../../../components/logo"

export default function AdminSidebar() {
  const [activeTab, setActiveTab] = useState("users")
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setMobileOpen(false)

    // Show/hide sections
    const usersSection = document.getElementById("users-section")
    const coursesSection = document.getElementById("courses-section")

    if (tab === "users") {
      usersSection?.classList.remove("hidden")
      coursesSection?.classList.add("hidden")
    } else {
      usersSection?.classList.add("hidden")
      coursesSection?.classList.remove("hidden")
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          
          <div className="hidden lg:block">
            <Logo textSize="text-xl"/>
            <p className="text-xs ">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="mt-8 flex-1">
        <div className="space-y-2 px-3">
          <Button
            variant={activeTab === "users" ? "secondary" : "ghost"}
            className="w-full justify-start lg:justify-start px-3 py-3 h-auto"
            onClick={() => handleTabChange("users")}
          >
            <Users className="h-5 w-5 lg:mr-3" />
            <span className="hidden lg:inline">User Management</span>
          </Button>
          <Button
            variant={activeTab === "courses" ? "secondary" : "ghost"}
            className="w-full justify-start lg:justify-start px-3 py-3 h-auto"
            onClick={() => handleTabChange("courses")}
          >
            <BookOpen className="h-5 w-5 lg:mr-3" />
            <span className="hidden lg:inline">Course Management</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start lg:justify-start px-3 py-3 h-auto">
            <Settings className="h-5 w-5 lg:mr-3" />
            <span className="hidden lg:inline">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-16 xl:w-64  border-r flex-col">
        <SidebarContent />
      </div>
    </>
  )
}
