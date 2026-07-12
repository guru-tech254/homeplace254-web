"use client";

import { useState } from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import ListingCard from "./ListingCard";
import MapView from "./MapView";

// ✅ FIX: Replaced missing @/types/supabase with local interface matching ListingCard
interface Property {
  id: string;
  title: string;
  price: number;
  currency?: string;
  status: string;
  estate: string;
  county: string;
  amenities: {
    bedrooms?: number;
    bathrooms?: number;
    parking?: boolean;
    [key: string]: any;
  } | null;
  primary_image_url: string;
  is_verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface MarketplaceViewProps {
  properties: Property[];
}

export default function MarketplaceView({ properties }: MarketplaceViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-end gap-2 bg-white p-2 rounded-lg border border-ocean-blue/10 w-fit ml-auto shadow-sm">
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            viewMode === "grid"
              ? "bg-deep-navy text-white shadow-md"
              : "text-ink/60 hover:bg-mist-white"
          }`}
        >
          <LayoutGrid size={16} /> Grid
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            viewMode === "map"
              ? "bg-deep-navy text-white shadow-md"
              : "text-ink/60 hover:bg-mist-white"
          }`}
        >
          <MapIcon size={16} /> Map
        </button>
      </div>

      {/* Content Area */}
      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <ListingCard key={property.id} property={property} />
          ))}
          {properties.length === 0 && (
            <div className="col-span-full text-center py-20 text-ink/50">
              No properties found in this area.
            </div>
          )}
        </div>
      ) : (
        <MapView properties={properties} />
      )}
    </div>
  );
}