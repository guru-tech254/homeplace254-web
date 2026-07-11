"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

// Define filter options based on our database schema
const CATEGORIES = [
  { value: "", label: "All Listings" },
  { value: "rental", label: "Rentals" },
  { value: "house_sale", label: "Houses for Sale" },
  { value: "plot_land", label: "Plots & Land" },
];

const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  rental: [
    { value: "", label: "All Types" },
    { value: "bedsitter", label: "Bedsitter" },
    { value: "1_bedroom", label: "1 Bedroom" },
    { value: "2_bedroom", label: "2 Bedrooms" },
    { value: "3_bedroom", label: "3+ Bedrooms" },
    { value: "single_room", label: "Single Room" },
  ],
  house_sale: [
    { value: "", label: "All Types" },
    { value: "bungalow", label: "Bungalow" },
    { value: "apartment", label: "Apartment" },
    { value: "mansion", label: "Mansion" },
    { value: "townhouse", label: "Townhouse" },
  ],
  plot_land: [
    { value: "", label: "All Sizes" },
    { value: "50x100", label: "50x100" },
    { value: "1_8_acre", label: "1/8 Acre" },
    { value: "commercial", label: "Commercial" },
  ],
};

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [subCategory, setSubCategory] = useState(searchParams.get("sub_category") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (category) params.set("category", category);
    else params.delete("category");
    
    if (subCategory) params.set("sub_category", subCategory);
    else params.delete("sub_category");
    
    if (searchQuery) params.set("q", searchQuery);
    else params.delete("q");

    router.push(`/?${params.toString()}`);
  };

  // Auto-apply when dropdowns change
  useEffect(() => {
    applyFilters();
  }, [category, subCategory]);

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm border border-ocean-blue/10 md:flex-row md:items-center">
      
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
        <input
          type="text"
          placeholder="Search by location, estate..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
        />
      </div>

      {/* Category Dropdown */}
      <select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setSubCategory(""); // Reset sub-category when main category changes
        }}
        className="rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Sub-Category Dropdown (Dynamic) */}
      {category && SUB_CATEGORIES[category] && (
        <select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
        >
          {SUB_CATEGORIES[category].map((sub) => (
            <option key={sub.value} value={sub.value}>
              {sub.label}
            </option>
          ))}
        </select>
      )}

      {/* Apply Button (For search query only) */}
      <button
        onClick={applyFilters}
        className="flex items-center justify-center gap-2 rounded-lg bg-deep-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-blue"
      >
        <SlidersHorizontal size={16} />
        Apply
      </button>
    </div>
  );
}