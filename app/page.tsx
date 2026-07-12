"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Home, MapPin, Bed, Bath, Car, Search, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Listing {
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
  property_name: string;
  estate: string;
  county: string;
  landlord_id: string;
  likes_count: number;
  is_liked_by_visitor: boolean;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

  // Helper to get or create a unique visitor ID
  const getVisitorId = () => {
    if (typeof window === "undefined") return "";
    let visitorId = localStorage.getItem("homeplace_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("homeplace_visitor_id", visitorId);
    }
    return visitorId;
  };

  // ✅ FIX: Functions declared BEFORE useEffect
  const fetchListings = async () => {
    try {
      const visitorId = getVisitorId();

      // Step 1: Fetch basic listing data without nested joins
      const { data, error: fetchError } = await supabaseAuth
        .from("listings")
        .select(`
          id,
          title,
          description,
          category,
          sub_category,
          price,
          bedrooms,
          bathrooms,
          parking,
          primary_image_url,
          status,
          property_id
        `)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(24);

      if (fetchError) {
        console.error("Error fetching listings:", fetchError);
        setError(true);
        setLoading(false);
        return;
      }

      // Step 2: Enrich each listing with property details, landlord_id, and like counts
      const enrichedListings = await Promise.all(
        (data || []).map(async (listing) => {
          // Fetch property details including landlord_id
          let propertyData = null;
          if (listing.property_id) {
            const { data: prop } = await supabaseAuth
              .from("properties")
              .select("name, estate, county, landlord_id")
              .eq("id", listing.property_id)
              .single();

            propertyData = prop;
          }

          // Fetch like count AND check if current visitor liked it
          const { count: likesCount, data: likeData } = await supabaseAuth
            .from("likes")
            .select("*", { count: "exact" })
            .eq("listing_id", listing.id);

          const isLikedByVisitor = likeData?.some(
            (like: any) => like.visitor_id === visitorId
          );

          return {
            ...listing,
            property_name: propertyData?.name || "Property",
            estate: propertyData?.estate || "",
            county: propertyData?.county || "",
            landlord_id: propertyData?.landlord_id || "",
            likes_count: likesCount || 0,
            is_liked_by_visitor: !!isLikedByVisitor,
          };
        })
      );

      setListings(enrichedListings);
      setError(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const visitorId = getVisitorId();
    if (!visitorId) return;

    try {
      // Check if this visitor already liked this listing
      const { data: existingLike, error: checkError } = await supabaseAuth
        .from("likes")
        .select("id")
        .eq("listing_id", listingId)
        .eq("visitor_id", visitorId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking like status:", checkError);
        return;
      }

      if (existingLike) {
        // UNLIKE: Delete the record
        const { error: deleteError } = await supabaseAuth
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          console.error("Error unliking:", deleteError);
          return;
        }
      } else {
        // LIKE: Insert new record
        const { error: insertError } = await supabaseAuth.from("likes").insert({
          listing_id: listingId,
          visitor_id: visitorId,
        });

        if (insertError) {
          console.error("Error liking:", insertError);
          return;
        }
      }

      // Refresh listings to update count and heart icon state
      fetchListings();
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Client-side filtering (fast and responsive)
  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.estate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.property_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || listing.category === categoryFilter;
    const matchesPrice =
      listing.price >= priceRange[0] && listing.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-blue mx-auto mb-4"></div>
          <p className="text-deep-navy">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white flex flex-col">
      {/* Header */}
      <header className="bg-deep-navy shadow-md sticky top-0 z-50 h-[5.5rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <Link
              href="/"
              className="flex items-center gap-3 bg-white rounded-lg p-1.5 shadow-sm"
            >
              <img
                src="/logo.png"
                alt="HomePlace254 Logo"
                className="h-[4rem] w-auto object-contain"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-white font-semibold hover:text-amber-gold transition-colors"
              >
                Home
              </Link>
              <Link
                href="#listings"
                className="text-white/80 hover:text-amber-gold transition-colors"
              >
                Browse Listings
              </Link>
              <Link
                href="/auth/login"
                className="bg-amber-gold text-white px-5 py-2.5 rounded-lg font-semibold hover:brightness-90 transition-all"
              >
                Portal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="Modern Living Room"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-deep-navy/70 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-lg">
            Find Your Next Home in Kenya
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/90 font-light max-w-3xl mx-auto drop-shadow-md">
            Verified rentals and properties for sale. Your link to your next
            home.
          </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink/50 h-5 w-5" />
              <input
                type="text"
                placeholder="Search location, estate, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-ink bg-transparent focus:outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="md:w-48 px-4 py-3 rounded-xl text-ink bg-mist-white focus:outline-none border border-ocean-blue/10"
            >
              <option value="all">All Types</option>
              <option value="rental">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
            <button className="bg-amber-gold text-white px-8 py-3 rounded-xl font-bold hover:brightness-90 transition-all">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section id="listings" className="py-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-deep-navy">
                Available Listings
              </h2>
              <p className="text-ink/70 mt-1">
                {filteredListings.length} properties found
              </p>
            </div>

            {/* Price Range Slider */}
            <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-ocean-blue/10">
              <span className="text-sm font-semibold text-deep-navy">
                Max Price:
              </span>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([0, parseInt(e.target.value)])
                }
                className="w-32 accent-ocean-blue"
              />
              <span className="text-sm text-ocean-blue font-bold">
                KES {priceRange[1].toLocaleString()}
              </span>
            </div>
          </div>

          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Failed to load listings.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-ocean-blue text-white rounded-lg hover:bg-deep-navy"
              >
                Retry
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Home className="mx-auto h-16 w-16 text-ocean-blue/30 mb-4" />
              <h3 className="text-xl font-bold text-deep-navy mb-2">
                No listings found
              </h3>
              <p className="text-ink/70">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm border border-ocean-blue/10 transition-all hover:shadow-lg hover:-translate-y-1 relative"
                >
                  {/* Like Button Overlay */}
                  <button
                    onClick={(e) => handleLike(listing.id, e)}
                    className="absolute top-3 right-3 z-10 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition-colors group/btn"
                  >
                    <Heart
                      size={18}
                      className={`transition-colors ${
                        listing.is_liked_by_visitor
                          ? "text-red-500 fill-red-500"
                          : "text-ink/60 group-hover/btn:text-red-500"
                      }`}
                    />
                  </button>

                  {/* Image */}
                  <div className="relative h-56 bg-mist-white overflow-hidden">
                    {listing.primary_image_url ? (
                      <img
                        src={listing.primary_image_url}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ocean-blue/10 to-teal-500/10">
                        <Home className="h-16 w-16 text-ocean-blue/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-deep-navy capitalize">
                      {listing.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-deep-navy text-lg line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-amber-gold font-semibold line-clamp-1">
                        {listing.property_name}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-ink/70 mt-1">
                        <MapPin size={14} />
                        <span className="line-clamp-1">
                          {listing.estate}, {listing.county}
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-4 text-xs text-ink/60 py-2 border-y border-ocean-blue/10">
                      <div className="flex items-center gap-1">
                        <Bed size={14} />
                        <span>{listing.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath size={14} />
                        <span>{listing.bathrooms} Baths</span>
                      </div>
                      {listing.parking && (
                        <div className="flex items-center gap-1">
                          <Car size={14} />
                          <span>Parking</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-xs text-ink/60">
                          {listing.category === "rental"
                            ? "Monthly Rent"
                            : "Price"}
                        </p>
                        <p className="text-xl font-bold text-ocean-blue">
                          KES {listing.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="px-4 py-2 bg-deep-navy text-white text-sm font-semibold rounded-lg hover:bg-ocean-blue transition-colors"
                        >
                          View
                        </Link>

                        {/* Inline Chat Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("open-chat", {
                                detail: {
                                  listingId: listing.id,
                                  landlordId: listing.landlord_id,
                                },
                              })
                            );
                          }}
                          className="p-2 border border-ocean-blue/20 text-ocean-blue rounded-lg hover:bg-ocean-blue/5 transition-colors"
                          title="Chat with Landlord"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Likes Counter */}
                    <div className="flex items-center gap-1 text-xs text-ink/50 pt-2">
                      <Heart
                        size={12}
                        className={
                          listing.is_liked_by_visitor
                            ? "fill-red-500 text-red-500"
                            : "fill-ink/50"
                        }
                      />
                      <span>
                        {listing.likes_count}{" "}
                        {listing.likes_count === 1 ? "like" : "likes"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-navy text-white py-6 mt-auto border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-white">
              HomePlace<span className="text-amber-gold">254</span>
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              Your Link to Your Next Home
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="#listings"
              className="hover:text-white transition-colors"
            >
              Listings
            </Link>
          </div>
          <div className="text-center md:text-right text-white/40 text-xs">
            <p>&copy; 2026 HomePlace254. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}