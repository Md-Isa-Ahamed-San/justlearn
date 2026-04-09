// Utility functions for role-related operations
import { User, GraduationCap, Shield } from "lucide-react"

// Function to generate academic sessions
export const generateAcademicSessions = () => {
  const currentYear = new Date().getFullYear()
  const sessions = []

  // Generate sessions from 10 years ago to 1 year in the future
  for (let i = -10; i <= 1; i++) {
    const startYear = currentYear + i
    const endYear = startYear + 1
    sessions.push(`${startYear}-${endYear}`)
  }

  return sessions.reverse() // Most recent first
}

export const getRoleIcon = (role, className = "h-5 w-5") => {
  const iconClass =
    role === "instructor" ? "text-blue-600" : role === "student" ? "text-green-600" : "text-purple-600"

  switch (role) {
    case "instructor":
      return <GraduationCap className={`${className} ${iconClass}`} />
    case "student":
      return <User className={`${className} ${iconClass}`} />
    case "admin":
      return <Shield className={`${className} ${iconClass}`} />
    default:
      return <User className={`${className} text-gray-600`} />
  }
}

export const getRoleColor = (role) => {
  switch (role) {
    case "instructor":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "student":
      return "bg-green-100 text-green-800 border-green-200"
    case "admin":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const getRoleDescription = (role) => {
  switch (role) {
    case "instructor":
      return "Create and manage courses, track student progress, and provide educational content."
    case "student":
      return "Enroll in courses, track your learning progress, and earn certificates."
    case "admin":
      return "Manage the platform, oversee users, and maintain system operations."
  }
}
export const getColorClasses = (scheme, selected) => {
  const colors = {
    blue: {
      border: selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300",
      accent: "text-blue-600",
      bg: selected ? "bg-blue-100" : "bg-white hover:bg-blue-50"
    },
    green: {
      border: selected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300",
      accent: "text-green-600",
      bg: selected ? "bg-green-100" : "bg-white hover:bg-green-50"
    },
    purple: {
      border: selected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300",
      accent: "text-purple-600",
      bg: selected ? "bg-purple-100" : "bg-white hover:bg-purple-50"
    }
  }
  return colors[scheme] || colors.blue
}
export const getRoleColorScheme = (role) => {
  switch (role) {
    case "instructor":
      return "hover:bg-blue-50 hover:border-blue-200 peer-checked:bg-blue-50 peer-checked:border-blue-500"
    case "student":
      return "hover:bg-green-50 hover:border-green-200 peer-checked:bg-green-50 peer-checked:border-green-500"
    case "admin":
      return "hover:bg-purple-50 hover:border-purple-200 peer-checked:bg-purple-50 peer-checked:border-purple-500"
    default:
      return "hover:bg-gray-50 hover:border-gray-200 peer-checked:bg-gray-50 peer-checked:border-gray-500"
  }
}