"use client";

import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import ListingCard from "./ListingCard";

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
        <div className="w-full h-[400px] rounded-xl border border-ocean-blue/10 shadow-sm z-0 relative">
          <LeafletMap properties={properties} />
        </div>
      )}
    </div>
  );
}

// Internal component to handle Leaflet logic separately
function LeafletMap({ properties }: { properties: Property[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Nairobi by default
    const map = L.map(containerRef.current).setView([-1.2921, 36.8219], 12);
    mapRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Fix for default marker icons in Next.js/Leaflet
    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    // Add markers for each property
    properties.forEach((prop) => {
      if (prop.latitude && prop.longitude) {
        const marker = L.marker([prop.latitude, prop.longitude], { icon }).addTo(map);
        marker.bindPopup(`<b>${prop.title}</b><br/>${prop.estate}, ${prop.county}`);
      }
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [properties]);

  return <div ref={containerRef} className="w-full h-full" />;
}