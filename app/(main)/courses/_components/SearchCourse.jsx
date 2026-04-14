"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const SearchCourse = ({ defaultValue = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.delete("page"); // reset to page 1 on new search
    router.push(`${pathname}?${params.toString()}`);
  }, 350);

  return (
    <div className="relative h-10 max-lg:w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10 h-4 w-4" />
      <Input
        type="text"
        aria-label="Search courses"
        placeholder="Search courses..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-8 pr-3 py-2 text-sm"
      />
    </div>
  );
};

export default SearchCourse;
