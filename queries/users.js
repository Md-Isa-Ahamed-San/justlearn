import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { db } from "../lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// Helper function to get include options based on role
const getIncludeByRole = (role) => {
  const includeOptions = {};
  switch (role) {
    case "student":
      includeOptions.student = true;
      break;
    case "instructor":
      includeOptions.instructor = true;
      break;
    case "admin":
      includeOptions.admin = true;
      break;
    default:
      // If role is unknown, include all (fallback)
      includeOptions.student = true;
      includeOptions.instructor = true;
      includeOptions.admin = true;
  }
  return includeOptions;
};

// =================== BASIC USER OPERATIONS ===================

// MARK: Get server user data
export const getServerUserData = cache(async function getServerUserData() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return null;
    }

    // Since auth() already provides user, role, and image in the session from the JWT callback,
    // we only fetch full database details if specifically needed.
    const userData = await getUserByEmail(session.user.email);

    return {
      ...session,
      userData,
    };
  } catch (error) {
    console.error("Error fetching server user data:", error);
    return null;
  }
});
//MARK: POST USER
export const postUser = async (data) => {
  try {
    const user = await db.user.create({
      data: {
        name: data.name,

        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role,
      },
    });
    return user;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// MARK:Check if user profile is complete (middleware helper)

// =================== ROLE-SPECIFIC PROFILE CREATION ===================

// MARK: Complete student profile
export const completeStudentProfile = async (userId, studentData) => {
  try {
    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "student") {
      throw new Error("User is not a student");
    }

    // Check if student profile already exists
    const existingStudent = await db.student.findUnique({
      where: { userId },
    });

    if (existingStudent) {
      throw new Error("Student profile already exists");
    }

    const student = await db.student.create({
      data: {
        userId,
        idNumber: studentData.idNumber,
        session: studentData.session,
        department: studentData.department,
        phone: studentData.phone || "",
        bio: studentData.bio || "",
        profilePicture: studentData.profilePicture || "",
        socialMedia: studentData.socialMedia || null,
        isActive: studentData.isActive ?? true,
      },
    });

    return student;
  } catch (error) {
    throw new Error(`Error completing student profile: ${error.message}`);
  }
};

// MARK: Complete instructor profile
export const completeInstructorProfile = async (userId, instructorData) => {
  try {
    // Verify user exists and is an instructor
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "instructor") {
      throw new Error("User is not an instructor");
    }

    // Check if instructor profile already exists
    const existingInstructor = await db.instructor.findUnique({
      where: { userId },
    });

    if (existingInstructor) {
      throw new Error("Instructor profile already exists");
    }

    const instructor = await db.instructor.create({
      data: {
        userId,
        idNumber: instructorData.idNumber,
        department: instructorData.department,
        phone: instructorData.phone || "",
        bio: instructorData.bio || "",
        designation: instructorData.designation,
        profilePicture: instructorData.profilePicture || "",
        socialMedia: instructorData.socialMedia || {},
        isActive: instructorData.isActive ?? true,
      },
    });

    return instructor;
  } catch (error) {
    throw new Error(`Error completing instructor profile: ${error.message}`);
  }
};

// MARK: Complete admin profile
export const completeAdminProfile = async (userId, adminData) => {
  try {
    // Verify user exists and is an admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "admin") {
      throw new Error("User is not an admin");
    }

    // Check if admin profile already exists
    const existingAdmin = await db.admin.findUnique({
      where: { userId },
    });

    if (existingAdmin) {
      throw new Error("Admin profile already exists");
    }

    const admin = await db.admin.create({
      data: {
        userId,
        idNumber: adminData.idNumber || null,
        phone: adminData.phone || "",
        bio: adminData.bio || "",
        designation: adminData.designation,
        profilePicture: adminData.profilePicture || "",
        socialMedia: adminData.socialMedia || {},
        isActive: adminData.isActive ?? true,
      },
    });

    return admin;
  } catch (error) {
    throw new Error(`Error completing admin profile: ${error.message}`);
  }
};

// =================== GENERAL USER OPERATIONS ===================

// MARK: Get all users
export const getAllUsers = async () => {
  try {
    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: true,
        instructor: true,
        admin: true
      }
    });

    const formattedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      
      if (user.role === 'student') {
        delete userWithoutPassword.instructor;
        delete userWithoutPassword.admin;
      } else if (user.role === 'instructor') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.admin;
      } else if (user.role === 'admin') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.instructor;
      }
      
      return userWithoutPassword;
    });

    return formattedUsers;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

// MARK: Get user by id
export const getUser = async (id) => {
  try {
    // First get the user to know their role
    const userBasic = await db.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!userBasic) {
      throw new Error("User not found");
    }

    // Then fetch with appropriate include
    const user = await db.user.findUnique({
      where: { id },
      include: getIncludeByRole(userBasic.role),
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// MARK: Get user by email
export const getUserByEmail = unstable_cache(
  async (email) => {
    try {
      // Fetch user with all potential role-based relations in a single query
      const user = await db.user.findUnique({
        where: { email },
        include: {
          student: true,
          instructor: true,
          admin: true,
        },
      });

      if (!user) {
        return null;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Optional: Filter the relations in JS to match current active role 
      // This keeps the object clean but prevents multiple DB hits
      const role = user.role?.toLowerCase();
      if (role === 'student') {
        delete userWithoutPassword.instructor;
        delete userWithoutPassword.admin;
      } else if (role === 'instructor') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.admin;
      } else if (role === 'admin') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.instructor;
      }

      return userWithoutPassword;
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error.message);
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  },
  (email) => ["user", email],
  {
    tags: ["user-data"],
    revalidate: 3600, // 1 hour
  }
);

// MARK: Get users by role with efficient querying
export const getUsersByRole = async (role) => {
  try {
    const includeOptions = {};

    // Only include the relevant role table for efficiency
    switch (role.toUpperCase()) {
      case "student":
        includeOptions.student = true;
        break;
      case "instructor":
        includeOptions.instructor = true;
        break;
      case "admin":
        includeOptions.admin = true;
        break;
      default:
        throw new Error("Invalid role specified");
    }

    const users = await db.user.findMany({
      where: {
        role: role.toUpperCase(),
      },
      include: includeOptions,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remove passwords from response
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    throw new Error(`Error fetching users by role: ${error.message}`);
  }
};

// =================== PROFILE UPDATE OPERATIONS ===================

// MARK: Update basic user info
export const updateUser = async (id, userData) => {
  try {
    const { password, ...updateData } = userData;

    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // First get user role
    const userBasic = await db.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!userBasic) {
      throw new Error("User not found");
    }

    // Update user
    await db.user.update({
      where: { id },
      data: updateData,
    });

    // Fetch updated user with appropriate role data
    const user = await db.user.findUnique({
      where: { id },
      include: getIncludeByRole(userBasic.role),
    });

    if (!user) {
      throw new Error("Failed to fetch updated user");
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

// MARK: Update student profile
export const updateStudentProfile = async (userId, studentData) => {
  try {
    const student = await db.student.update({
      where: { userId },
      data: studentData,
    });

    return student;
  } catch (error) {
    throw new Error(`Error updating student profile: ${error.message}`);
  }
};

// MARK: Update instructor profile
export const updateInstructorProfile = async (userId, instructorData) => {
  try {
    const instructor = await db.instructor.update({
      where: { userId },
      data: instructorData,
    });

    return instructor;
  } catch (error) {
    throw new Error(`Error updating instructor profile: ${error.message}`);
  }
};

// MARK: Update admin profile
export const updateAdminProfile = async (userId, adminData) => {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: adminData,
    });

    return admin;
  } catch (error) {
    throw new Error(`Error updating admin profile: ${error.message}`);
  }
};

// =================== DELETE OPERATIONS ===================

// MARK: Delete user
export const deleteUser = async (id) => {
  try {
    const result = await db.$transaction(async (prisma) => {
      // Get user to determine role
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          role: true,
          student: { select: { id: true } },
          instructor: { select: { id: true } },
          admin: { select: { id: true } },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Delete role-specific record first (due to foreign key constraints)
      if (user.role === "student" && user.student) {
        await prisma.student.delete({
          where: { userId: id },
        });
      } else if (user.role === "instructor" && user.instructor) {
        await prisma.instructor.delete({
          where: { userId: id },
        });
      } else if (user.role === "admin" && user.admin) {
        await prisma.admin.delete({
          where: { userId: id },
        });
      }

      // Delete the base user record
      const deletedUser = await prisma.user.delete({
        where: { id },
      });

      return deletedUser;
    });

    return result;
  } catch (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

// =================== ADDITIONAL UTILITY FUNCTIONS ===================

// MARK: Create user (for admin purposes)
export const createUser = async (data) => {
  try {
    const { role, roleData, ...userData } = data;

    // Create user with transaction to ensure data consistency
    const result = await db.$transaction(async (prisma) => {
      // Create the base user with role
      const user = await prisma.user.create({
        data: {
          name: userData.name,

          email: userData.email,
          password: await bcrypt.hash(userData.password, 10),
          role: role || "student", // Default to STUDENT if not provided
        },
      });

      // Create role-specific record based on the role
      let roleRecord = null;

      if (role === "student") {
        roleRecord = await prisma.student.create({
          data: {
            userId: user.id,
            idNumber: roleData.idNumber,
            session: roleData.session,
            department: roleData.department,
            phone: roleData.phone || "",
            bio: roleData.bio || "",
            profilePicture: roleData.profilePicture || "",
            socialMedia: roleData.socialMedia || null,
            isActive: roleData.isActive ?? true,
          },
        });
      } else if (role === "instructor") {
        roleRecord = await prisma.instructor.create({
          data: {
            userId: user.id,
            idNumber: roleData.idNumber,
            department: roleData.department,
            phone: roleData.phone || "",
            bio: roleData.bio || "",
            designation: roleData.designation,
            profilePicture: roleData.profilePicture || "",
            socialMedia: roleData.socialMedia || {},
            isActive: roleData.isActive ?? true,
          },
        });
      } else if (role === "admin") {
        roleRecord = await prisma.admin.create({
          data: {
            userId: user.id,
            idNumber: roleData.idNumber || null,
            phone: roleData.phone || "",
            bio: roleData.bio || "",
            designation: roleData.designation,
            profilePicture: roleData.profilePicture || "",
            socialMedia: roleData.socialMedia || {},
            isActive: roleData.isActive ?? true,
          },
        });
      }

      // Return user with role data (only include relevant role)
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        include: getIncludeByRole(role),
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = userWithRole;
      return userWithoutPassword;
    });

    return result;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// MARK: Get active users by role
export const getActiveUsersByRole = async (role) => {
  try {
    const whereCondition = {
      role: role.toUpperCase(),
    };

    // Add role-specific active condition
    if (role.toUpperCase() === "student") {
      whereCondition.student = { isActive: true };
    } else if (role.toUpperCase() === "instructor") {
      whereCondition.instructor = { isActive: true };
    } else if (role.toUpperCase() === "admin") {
      whereCondition.admin = { isActive: true };
    }

    const includeOptions = {};
    includeOptions[role.toLowerCase()] = true;

    const users = await db.user.findMany({
      where: whereCondition,
      include: includeOptions,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remove passwords from response
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    throw new Error(`Error fetching active users by role: ${error.message}`);
  }
};

// MARK: Get user count by role
export const getUserCountByRole = async () => {
  try {
    const counts = await db.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    // Transform to more readable format
    const result = {
      student: 0,
      instructor: 0,
      admin: 0,
    };

    counts.forEach((count) => {
      result[count.role] = count._count.role;
    });

    return result;
  } catch (error) {
    throw new Error(`Error getting user count by role: ${error.message}`);
  }
};

// MARK: Search users with filters
export const searchUsers = async (filters = {}) => {
  try {
    const {
      search,
      role,
      isActive,
      department,
      page = 1,
      limit = 10,
    } = filters;

    const whereCondition = {};

    // Search in name or email
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },

        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role) {
      whereCondition.role = role.toUpperCase();
    }

    // Filter by department (works for students and instructors)
    if (department) {
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        {
          student: {
            department: { contains: department, mode: "insensitive" },
          },
        },
        {
          instructor: {
            department: { contains: department, mode: "insensitive" },
          },
        },
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        { student: { isActive } },
        { instructor: { isActive } },
        { admin: { isActive } },
      ];
    }

    const skip = (page - 1) * limit;

    const [usersWithRoles, total] = await Promise.all([
      db.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          student: true,
          instructor: true,
          admin: true
        }
      }),
      db.user.count({
        where: whereCondition,
      }),
    ]);

    const formattedUsers = usersWithRoles.map(user => {
      const { password, ...userWithoutPassword } = user;
      
      if (user.role === 'student') {
        delete userWithoutPassword.instructor;
        delete userWithoutPassword.admin;
      } else if (user.role === 'instructor') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.admin;
      } else if (user.role === 'admin') {
        delete userWithoutPassword.student;
        delete userWithoutPassword.instructor;
      }
      
      return userWithoutPassword;
    });

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error searching users: ${error.message}`);
  }
};
