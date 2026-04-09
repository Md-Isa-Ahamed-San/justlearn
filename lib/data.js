// Mock data for the admin dashboard
// In a real application, this would be fetched from a database

export function getUserData() {
  return [
    {
      id: "1",
      name: "Dr. John Smith",
      email: "john.smith@university.edu",
      role: "instructor",
      status: "pending",
      isActive: true,
      department: "Computer Science",
      joinDate: "2024-06-01",
      avatar: null,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@student.edu",
      role: "student",
      status: "active",
      isActive: true,
      department: "Mathematics",
      joinDate: "2024-05-15",
      avatar: null,
    },
    {
      id: "3",
      name: "Prof. Michael Chen",
      email: "michael.chen@university.edu",
      role: "instructor",
      status: "approved",
      isActive: true,
      department: "Physics",
      joinDate: "2024-04-20",
      avatar: null,
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@student.edu",
      role: "student",
      status: "active",
      isActive: false,
      department: "Biology",
      joinDate: "2024-03-10",
      avatar: null,
    },
  ]
}

export function getCourseData() {
  return [
    {
      id: "1",
      title: "Advanced React Patterns",
      instructor: "Dr. John Smith",
      students: 1245,
      status: "published",
      isPublic: true,
      category: "Programming",
      createdDate: "2024-05-01",
      rating: 4.8,
    },
    {
      id: "2",
      title: "Machine Learning Fundamentals",
      instructor: "Prof. Michael Chen",
      students: 892,
      status: "draft",
      isPublic: false,
      category: "AI/ML",
      createdDate: "2024-05-15",
      rating: 4.6,
    },
    {
      id: "3",
      title: "Database Design Principles",
      instructor: "Dr. Sarah Williams",
      students: 567,
      status: "published",
      isPublic: true,
      category: "Database",
      createdDate: "2024-04-10",
      rating: 4.7,
    },
    {
      id: "4",
      title: "Web Development Bootcamp",
      instructor: "Prof. David Brown",
      students: 2341,
      status: "archived",
      isPublic: false,
      category: "Web Development",
      createdDate: "2024-02-01",
      rating: 4.5,
    },
  ]
}
