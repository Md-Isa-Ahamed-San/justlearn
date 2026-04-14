'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '../../lib/prisma';

export async function handlePersonalDetails(formData) {
  const data = Object.fromEntries(formData.entries());

  const {
    email,
    name,
    profilePicture,
    phone,
    idNumber,
    department,
    designation,
    session,
    bio,
    linkedin,
    facebook,
    github,
    googleScholar ,
    personalWebsite,
    researchGate,
    role,
  } = data;

  // Convert idNumber to int if present
  const parsedIdNumber = idNumber ? parseInt(idNumber, 10) : undefined;

  // Social media JSON object
  const socialMedia = {
    linkedin: linkedin || null,
    facebook: facebook || null,
    github: github || null,
    googleScholar: googleScholar || null,
    personalWebsite: personalWebsite || null,
    researchGate: researchGate || null
  };

  // 1. Find user by email
  const existingUser = await db.user.findUnique({
    where: { email },
    include: {
      instructor: true,
      student: true,
      admin: true,
    },
  });

  if (!existingUser) {
    throw new Error("User not found.");
  }
  if (!existingUser.role) {
    await db.user.update({
      where: { email },
      data: { role },
    });
  }
  
  await db.user.update({
    where: { email },
    data: {
      name,
      ...(profilePicture ? { image: profilePicture } : {})
    },
  });

  switch (role) {
    case "instructor":
      if (existingUser.instructor) {
       
        await db.instructor.update({
          where: { userId: existingUser.id },
          data: {
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            designation: designation || null,
            bio: bio || null,
            socialMedia,
          },
        });
      } else {
       
        await db.instructor.create({
          data: {
            userId: existingUser.id,
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            designation: designation || null,
            bio: bio || null,
            socialMedia,
          },
        });
      }
      break;

    case "student":
      if (existingUser.student) {
     
        await db.student.update({
          where: { userId: existingUser.id },
          data: {
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            session: session || null,
            bio: bio || null,
            socialMedia,
          },
        });
      } else {
        
        await db.student.create({
          data: {
            userId: existingUser.id,
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            session: session || null,
            bio: bio || null,
            socialMedia,
          },
        });
      }
      break;

    case "admin":
      if (existingUser.admin) {
      
        await db.admin.update({
          where: { userId: existingUser.id },
          data: {
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            designation: designation || null,
            bio: bio || null,
            socialMedia,
          },
        });
      } else {
      
        await db.admin.create({
          data: {
            userId: existingUser.id,
            phone: phone || null,
            idNumber: parsedIdNumber,
            department: department || null,
            designation: designation || null,
            bio: bio || null,
            socialMedia,
          },
        });
      }
      break;

    default:
      throw new Error("Invalid role provided");
  }

  revalidatePath("/account");
  revalidateTag("user-data");

  return { success: true };
}
