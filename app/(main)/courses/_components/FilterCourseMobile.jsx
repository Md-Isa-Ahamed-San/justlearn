"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FilterCourseMobile = ({categories,selectedCategories}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  console.log("FilterCourse ~ categories:", categories);
  console.log("FilterCourse ~ selectedCategories:", selectedCategories);

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
        params.append("categories", categoryTitle);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger>
          <Filter className="h-6 w-6" />
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="text-left">Filter Courses</SheetTitle>
            <Accordion defaultValue={["categories"]} type="multiple">
              {/* Categories filter */}
              <AccordionItem value="categories">
                <AccordionTrigger className="py-3 text-sm text-gray-400 hover:text-gray-500">
                  <span className="font-medium text-gray-900">Categories</span>
                </AccordionTrigger>

                <AccordionContent className="pt-6 animate-none">
                  <ul className="space-y-4">
                    {categories.map((category, optionIdx) => (
                      <li key={category.value} className="flex items-center">
                        <Checkbox
                          type="checkbox"
                          id={`category-${optionIdx}`}
                          onCheckedChange={() => {
                            handleCategoryChange(category?.title);
                          }}
                          checked={selectedCategories.includes(category?.title)}
                        />
                        <label
                          htmlFor={`category-${optionIdx}`}
                          className="ml-3 text-sm text-gray-600 cursor-pointer"
                        >
                          {category?.title}
                        </label>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FilterCourseMobile;
