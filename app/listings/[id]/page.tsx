"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { MapPin, Bed, Bath, Car, ArrowLeft, Home, CheckCircle2, Navigation, MessageCircle } from "lucide-react";
import Link from "next/link";
import GoogleMap from "@/components/GoogleMap";
import { useChat } from "@/lib/chat-context";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  sub_category: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  primary_image_url: string;
  status: string;
  created_at: string; // ✅ FIX: Added to resolve TS build error
  property_id: string; // ✅ FIX: Added to resolve TS build error
  property: {
    name: string;
    address: string;
    estate: string;
    county: string;
    landlord_id: string;
    amenities: Record<string, boolean> | null;
  } | null;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { openChat } = useChat();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Function declared BEFORE useEffect
  const fetchListingDetails = async () => {
    try {
      // Step 1: Fetch the listing with created_at included
      const { data: listingData, error } = await supabaseAuth
        .from("listings")
        .select("id, title, description, category, sub_category, price, bedrooms, bathrooms, parking, primary_image_url, status, created_at, property_id")
        .eq("id", listingId)
        .single();

      if (error || !listingData) {
        console.error("Listing not found or error:", error);
        setLoading(false);
        return;
      }

      // Step 2: Fetch the parent property details separately
      let propertyData = null;
      if (listingData.property_id) {
        const { data: prop } = await supabaseAuth
          .from("properties")
          .select("name, address, estate, county, landlord_id, amenities")
          .eq("id", listingData.property_id)
          .single();
        
        propertyData = prop;
      }

      setListing({
        ...listingData,
        property: propertyData,
      });
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
  }, [listingId]);

  const handleGetDirections = () => {
    if (!listing?.property) return;
    const address = encodeURIComponent(`${listing.property.address}, ${listing.property.estate}, ${listing.property.county}, Kenya`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-white">
        <div className="text-deep-navy">Loading listing details...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mist-white p-4">
        <Home className="h-16 w-16 text-ocean-blue/30 mb-4" />
        <h1 className="text-2xl font-bold text-deep-navy mb-2">Listing Not Found</h1>
        <p className="text-ink/70 mb-6">This property might have been rented or removed.</p>
        <Link href="/" className="text-ocean-blue font-semibold hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white pb-20">
      {/* Header Navigation */}
      <div className="bg-white border-b border-ocean-blue/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-ink/70 hover:text-deep-navy transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="ml-auto">
            <Link href="/" className="text-xl font-bold text-deep-navy">
              HomePlace<span className="text-amber-gold">254</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Image */}
            <div className="rounded-2xl overflow-hidden shadow-sm bg-white h-[400px] md:h-[500px]">
              {listing.primary_image_url ? (
                <img 
                  src={listing.primary_image_url} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-ocean-blue/10 to-teal-500/10">
                  <Home className="h-24 w-24 text-ocean-blue/30" />
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-ocean-blue/10">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-deep-navy mb-2">{listing.title}</h1>
                  <div className="flex items-center gap-2 text-ink/70">
                    <MapPin size={18} />
                    <span>{listing.property?.estate}, {listing.property?.county}</span>
                  </div>
                  {listing.property?.name && (
                    <p className="text-sm text-amber-gold font-semibold mt-1">
                      Part of {listing.property.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink/60">
                    {listing.category === "rental" ? "Monthly Rent" : "Price"}
                  </p>
                  <p className="text-3xl font-bold text-ocean-blue">
                    KES {Number(listing.price).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-ocean-blue/10">
                <FeatureItem icon={<Bed size={20} />} label="Bedrooms" value={listing.bedrooms} />
                <FeatureItem icon={<Bath size={20} />} label="Bathrooms" value={listing.bathrooms} />
                <FeatureItem icon={<Car size={20} />} label="Parking" value={listing.parking ? "Yes" : "No"} />
                <FeatureItem icon={<Home size={20} />} label="Type" value={listing.sub_category.replace('_', ' ')} />
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-xl font-bold text-deep-navy mb-3">Description</h2>
                <p className="text-ink/70 leading-relaxed whitespace-pre-line">
                  {listing.description || "No description provided for this listing."}
                </p>
              </div>

              {/* Property Amenities */}
              {listing.property?.amenities && Object.keys(listing.property.amenities).length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-deep-navy mb-3">Property Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(listing.property.amenities).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex items-center gap-2 text-ink/70">
                          <CheckCircle2 size={16} className="text-signal-green" />
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map */}
              {listing.property && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-deep-navy mb-3">Location</h2>
                  <GoogleMap 
                    address={listing.property.address}
                    estate={listing.property.estate}
                    county={listing.property.county}
                    height="350px"
                  />
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-ink/70">
                      <MapPin size={16} className="text-ocean-blue" />
                      <span>{listing.property.address}, {listing.property.estate}, {listing.property.county}</span>
                    </div>
                    <button 
                      onClick={handleGetDirections}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-blue text-white text-sm font-semibold rounded-lg hover:bg-deep-navy transition-colors"
                    >
                      <Navigation size={16} />
                      Get Directions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact/Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-lg border border-ocean-blue/10">
              <h3 className="text-lg font-bold text-deep-navy mb-4">Interested in this property?</h3>
              <p className="text-sm text-ink/70 mb-6">
                Contact the landlord to schedule a viewing or start the application process.
              </p>
              
              <button 
                onClick={() => openChat(listing.id, listing.property?.landlord_id || "")}
                className="w-full flex items-center justify-center gap-2 bg-amber-gold text-white font-bold py-3 rounded-lg hover:brightness-90 transition-all mb-3"
              >
                <MessageCircle size={18} />
                Chat with Landlord
              </button>
              
              <button className="w-full bg-deep-navy text-white font-bold py-3 rounded-lg hover:bg-ocean-blue transition-all">
                Schedule a Viewing
              </button>

              <div className="mt-6 pt-6 border-t border-ocean-blue/10 text-center">
                <p className="text-xs text-ink/60">
                  Listed on {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-mist-white rounded-xl">
      <div className="text-ocean-blue mb-2">{icon}</div>
      <p className="text-xs text-ink/60 uppercase tracking-wide">{label}</p>
      <p className="font-bold text-deep-navy text-lg capitalize">{value}</p>
    </div>
  );
}