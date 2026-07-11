"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Car, MessageCircle, Phone } from "lucide-react";

// Define a simple type for now to avoid Supabase dependency errors
interface Property {
  id: string;
  title: string;
  price: number;
  currency?: string;
  status: string;
  estate: string;
  county: string;
  amenities: any;
  primary_image_url: string;
  is_verified: boolean;
}

interface ListingCardProps {
  property: Property;
}

export default function ListingCard({ property }: ListingCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: property.currency || "KES",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-mist-white shadow-sm border border-ocean-blue/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      
      {/* IMAGE SECTION */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        <Image
            src={property.primary_image_url || "/placeholder-property.jpg"}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
        
        {property.is_verified && (
          <div className="absolute top-3 left-3 rounded-md bg-signal-green px-2 py-1 text-xs font-bold text-white">
            ✓ VERIFIED
          </div>
        )}

        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 rounded-full bg-mist-white/90 p-2 backdrop-blur-sm hover:bg-white"
        >
          <Heart size={20} className={isLiked ? "fill-amber-gold text-amber-gold" : "text-deep-navy"} />
        </button>
      </div>

      {/* PRICE & STATUS */}
      <div className="flex items-center justify-between border-b border-ocean-blue/10 px-4 py-3">
        <span className="text-xl font-bold text-amber-gold">{formattedPrice}</span>
        {property.status === "available" && (
          <span className="rounded-md bg-signal-green px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Available
          </span>
        )}
      </div>

      {/* DETAILS */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <h3 className="line-clamp-2 text-base font-bold text-ink leading-tight">
          {property.title}
        </h3>
        
        <div className="flex items-center gap-1 text-sm text-ocean-blue">
          <MapPin size={14} />
          <span>{property.estate}, {property.county}</span>
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs font-medium text-deep-navy">
          {property.amenities?.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed size={14} />
              <span>{property.amenities.bedrooms} Beds</span>
            </div>
          )}
          {property.amenities?.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath size={14} />
              <span>{property.amenities.bathrooms} Baths</span>
            </div>
          )}
          {property.amenities?.parking && (
            <div className="flex items-center gap-1">
              <Car size={14} />
              <span>Parking</span>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-2 border-t border-ocean-blue/10 p-4">
        <Link 
          href={`/chat?propertyId=${property.id}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-deep-navy py-2.5 text-sm font-semibold text-white hover:bg-ocean-blue transition-colors"
        >
          <MessageCircle size={16} />
          Chat
        </Link>
        <a
          href={`https://wa.me/?text=Hi, I'm interested in ${encodeURIComponent(property.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-signal-green py-2.5 text-sm font-semibold text-white hover:brightness-90 transition-colors"
        >
          <Phone size={16} />
          WhatsApp
        </a>
      </div>
    </div>
  );
}