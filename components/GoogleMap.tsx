"use client";

import { useEffect, useRef } from "react";

interface GoogleMapProps {
  address: string;
  estate: string;
  county: string;
  height?: string;
}

export default function GoogleMap({ address, estate, county, height = "400px" }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isInitialized = useRef(false); // Prevent double initialization in Strict Mode

  useEffect(() => {
    if (!mapRef.current || !apiKey || isInitialized.current) return;

    const loadMap = async () => {
      // ✅ GUARD: Only load script if google.maps is not already present
      if (!(window as any).google?.maps) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Geocode the address
      const geocoder = new (window as any).google.maps.Geocoder();
      const fullAddress = `${address}, ${estate}, ${county}, Kenya`;
      
      geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
        if (status === (window as any).google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: location,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
          });

          new (window as any).google.maps.Marker({
            position: location,
            map,
            title: fullAddress,
          });
        } else {
          // Fallback: Show map centered on Nairobi if geocoding fails
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: -1.2921, lng: 36.8219 },
            zoom: 12,
          });
        }
      });
    };

    loadMap();
    isInitialized.current = true; // Mark as initialized
  }, [address, estate, county, apiKey]);

  if (!apiKey) {
    return (
      <div className="bg-mist-white rounded-xl p-8 text-center border border-ocean-blue/10">
        <p className="text-ink/70">Google Maps API key not configured.</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="rounded-xl overflow-hidden shadow-sm border border-ocean-blue/10"
      style={{ height }}
    />
  );
}