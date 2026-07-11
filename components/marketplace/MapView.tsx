"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Database } from "@/types/supabase";

type Property = Database["public"]["Tables"]["properties"]["Row"];

// Fix default marker icon issue in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  properties: Property[];
}

export default function MapView({ properties }: MapViewProps) {
  // Filter out properties without valid coordinates
  const validProperties = properties.filter(
    (p) => p.latitude && p.longitude
  );

  if (validProperties.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-white border border-ocean-blue/10 text-ink/60">
        No properties with location data available
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border border-ocean-blue/10 shadow-sm">
      <MapContainer
        center={[-1.2921, 36.8219]} // Default: Nairobi CBD
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude!, property.longitude!]}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-deep-navy">{property.title}</h3>
                <p className="text-amber-gold font-semibold">
                  KES {property.price.toLocaleString()}
                </p>
                <p className="text-xs text-ink/70 mt-1">
                  {property.estate}, {property.county}
                </p>
                <a
                href={`/property/${property.id}`} // ✅ Updated dynamic route
                className="mt-2 block text-center rounded bg-ocean-blue px-3 py-1 text-xs font-bold text-white hover:bg-deep-navy"
                >
                View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}