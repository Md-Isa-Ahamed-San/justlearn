"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Checkbox } from "@/components/ui/checkbox";
import { List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const FilterCourse = ({ categories, selectedCategories = [] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  console.log("FilterCourse ~ categories:", categories);
  console.log("FilterCourse ~ selectedCategories:", selectedCategories);

  // Handle category filter changes
  const handleCategoryChange = useCallback(
    (categoryTitle) => {
      const params = new URLSearchParams(searchParams);
      const currentCategories = params.getAll("categories");

      if (currentCategories.includes(categoryTitle)) {
        params.delete("categories");
        const newCategories = currentCategories.filter(
          (category) => category !== categoryTitle
        );
        newCategories.forEach((category) =>
          params.append("categories", category)
        );
      } else {
        //current category not added. so added to the search params
        params.append("categories", categoryTitle);
      }

      // Update URL
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="hidden lg:block">
      <Accordion defaultValue={["categories"]} type="multiple">
        {/* Categories filter */}
        <AccordionItem value="categories">
          <AccordionTrigger className="py-3 text-sm">
            <span className="font-medium flex items-center gap-2 pl-3">
              <List className="w-4 h-4" />
              Categories
            </span>
          </AccordionTrigger>

          <AccordionContent className="pt-6 animate-none">
            <ul className="space-y-4">
              {categories?.map((category, optionIdx) => (
                <li key={category?.id} className="flex items-center pl-3">
                  <Checkbox
                    id={`category-${optionIdx}`}
                    aria-label={category?.title || "Category"}
                    onCheckedChange={() =>
                      handleCategoryChange(category?.title)
                    }
                    checked={selectedCategories.includes(category?.title)}
                  />
                  <label
                    htmlFor={`category-${optionIdx}`}
                    className="ml-3 text-sm cursor-pointer"
                  >
                    {category?.title}
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Debug: Show selected categories */}
      {/* {selectedCategories.length > 0 && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          Selected: {selectedCategories.join(", ")}
        </div>
      )} */}
    </div>
  );
};

export default FilterCourse;
