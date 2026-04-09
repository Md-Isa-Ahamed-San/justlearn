import { db } from "@/lib/prisma";

export const getCategories = async () => {
  try {
    const categories = await db.category.findMany();
    // console.log(" getCategories ~ categories:", categories)
    
    return categories;
  } catch {}
};
