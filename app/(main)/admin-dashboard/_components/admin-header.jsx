import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="lg:hidden w-10"></div> {/* Spacer for mobile menu button */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
            <AvatarFallback className="text-xs sm:text-sm">AD</AvatarFallback>
          </Avatar>
          <div className="text-xs sm:text-sm hidden sm:block">
            <p className="font-medium text-gray-900">Admin</p>
            <p className="text-gray-500">System Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
