"use client";

import { useState, lazy, Suspense } from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import ListingCard from "./ListingCard";
import type { Database } from "@/types/supabase";

type Property = Database["public"]["Tables"]["properties"]["Row"];

// Dynamically import MapView with SSR disabled
const MapView = lazy(() => import("./MapView"));

interface MarketplaceViewProps {
  properties: Property[];
}

export default function MarketplaceView({ properties }: MarketplaceViewProps) {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <>
      {/* View Toggle */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-lg border border-ocean-blue/20 bg-white p-1">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              view === "grid"
                ? "bg-deep-navy text-white shadow-sm"
                : "text-ink hover:bg-mist-white"
            }`}
          >
            <LayoutGrid size={16} />
            Grid
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              view === "map"
                ? "bg-deep-navy text-white shadow-sm"
                : "text-ink hover:bg-mist-white"
            }`}
          >
            <MapIcon size={16} />
            Map
          </button>
        </div>
      </div>

      {/* Conditional Rendering */}
      {view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <ListingCard key={property.id} property={property} />
          ))}
          {properties.length === 0 && (
            <div className="col-span-full py-20 text-center text-ink/60">
              No properties found matching your filters.
            </div>
          )}
        </div>
      ) : (
        // Wrap dynamic map in Suspense to prevent hydration errors
        <Suspense fallback={<div className="h-[500px] w-full animate-pulse rounded-xl bg-white/50" />}>
          <MapView properties={properties} />
        </Suspense>
      )}
    </>
  );
}