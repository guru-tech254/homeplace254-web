"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Home, MapPin, Bed, Bath, Car, Search, Heart, MessageCircle, Menu, X, ChevronDown } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

  const getVisitorId = () => {
    if (typeof window === "undefined") return "";
    let visitorId = localStorage.getItem("homeplace_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("homeplace_visitor_id", visitorId);
    }
    return visitorId;
  };

  const fetchListings = async () => {
    try {
      const visitorId = getVisitorId();
      const { data, error: fetchError } = await supabaseAuth
        .from("listings")
        .select(`id, title, description, category, sub_category, price, bedrooms, bathrooms, parking, primary_image_url, status, property_id`)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(24);

      if (fetchError) throw fetchError;

      const enrichedListings = await Promise.all(
        (data || []).map(async (listing) => {
          let propertyData = null;
          if (listing.property_id) {
            const { data: prop } = await supabaseAuth
              .from("properties")
              .select("name, estate, county, landlord_id")
              .eq("id", listing.property_id)
              .single();
            propertyData = prop;
          }

          const { count: likesCount, data: likeData } = await supabaseAuth
            .from("likes")
            .select("*", { count: "exact" })
            .eq("listing_id", listing.id);

          return {
            ...listing,
            property_name: propertyData?.name || "Property",
            estate: propertyData?.estate || "",
            county: propertyData?.county || "",
            landlord_id: propertyData?.landlord_id || "",
            likes_count: likesCount || 0,
            is_liked_by_visitor: !!likeData?.some((like: any) => like.visitor_id === visitorId),
          };
        })
      );

      setListings(enrichedListings);
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
      const { data: existingLike, error: checkError } = await supabaseAuth
        .from("likes")
        .select("id")
        .eq("listing_id", listingId)
        .eq("visitor_id", visitorId)
        .single();

      if (checkError && checkError.code !== "PGRST116") return;

      if (existingLike) {
        await supabaseAuth.from("likes").delete().eq("id", existingLike.id);
      } else {
        await supabaseAuth.from("likes").insert({ listing_id: listingId, visitor_id });
      }
      fetchListings();
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.estate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.property_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || listing.category === categoryFilter;
    const matchesPrice = listing.price >= priceRange[0] && listing.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white flex flex-col">
      {/* ✅ MOBILE-OPTIMIZED HEADER */}
            {/* ✅ FIXED MOBILE HEADER */}
      <header className="bg-deep-navy shadow-md sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo - Always Visible */}
          <Link href="/" className="flex items-center gap-3 bg-white rounded-lg p-1.5 shadow-sm shrink-0">
            <img src="/logo.png" alt="HomePlace254 Logo" className="h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Nav - Hidden on Mobile */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white font-semibold hover:text-amber-gold transition-colors">Home</Link>
            <Link href="#listings" className="text-white/80 hover:text-amber-gold transition-colors">Browse Listings</Link>
            <Link href="/auth/login" className="bg-amber-gold text-white px-5 py-2.5 rounded-lg font-semibold hover:brightness-90 transition-all">Portal</Link>
          </nav>

          {/* ✅ Mobile Menu Button - Visible ONLY on Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-deep-navy border-t border-white/10 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-white font-semibold py-2">Home</Link>
            <Link href="#listings" onClick={() => setIsMobileMenuOpen(false)} className="block text-white/80 py-2">Browse Listings</Link>
            <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="block bg-amber-gold text-white px-5 py-3 rounded-lg font-semibold text-center mt-2">Portal</Link>
          </div>
        )}
      </header>

      {/* ✅ CRYSTAL CLEAR HERO SECTION */}
            {/* ✅ CRYSTAL CLEAR HERO SECTION - NO WHITE FADE */}
            {/* ✅ CRYSTAL CLEAR HERO SECTION - NO WHITE FADE */}
      <section className="relative min-h-[85vh] md:min-h-[75vh] flex flex-col justify-center items-center overflow-hidden">
        
        {/* Background Image - Full Clarity */}
        <div className="absolute inset-0 z-0">
          {/* ✅ FIX: Removed 'priority' prop from native img tag */}
          <img
            src="/hero-bg.jpg"
            alt="Modern Living Room"
            className="w-full h-full object-cover object-center"
          />
          
          {/* Ultra-Subtle Edge Gradient: Only darkens top/bottom 15% for text safety */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-6 md:space-y-8 px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
            Find Your Next Home in Kenya
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-lg font-light">
            Verified rentals and properties for sale. Your link to your next home.
          </p>

          {/* Solid White Search Box - Crisp & Clean */}
          <div className="w-full bg-white rounded-2xl shadow-2xl p-4 md:p-6 mt-8 border border-white/20">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
                <input 
                  type="text" 
                  placeholder="Search location, estate, or property..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-mist-white border border-ocean-blue/10 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 text-base transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 rounded-xl bg-mist-white border border-ocean-blue/10 focus:outline-none focus:border-ocean-blue text-base cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="rental">For Rent</option>
                    <option value="sale">For Sale</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 h-4 w-4 pointer-events-none" />
                </div>
                <button className="w-full sm:w-auto bg-amber-gold hover:bg-amber-gold/90 text-white font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-gold/30">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* ✅ REMOVED THE WHITISH FADE - Clean Sharp Edge Instead */}
      </section>

      {/* Listings Section */}
      <section id="listings" className="py-12 md:py-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-deep-navy">Available Listings</h2>
              <p className="text-ink/70 mt-1">{filteredListings.length} properties found</p>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg border border-ocean-blue/10 w-full md:w-auto">
              <span className="text-sm font-semibold text-deep-navy whitespace-nowrap">Max Price:</span>
              <input type="range" min="0" max="500000" step="5000" value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} className="w-full md:w-32 accent-ocean-blue" />
              <span className="text-sm text-ocean-blue font-bold whitespace-nowrap">KES {priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Failed to load listings.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-ocean-blue text-white rounded-lg hover:bg-deep-navy">Retry</button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Home className="mx-auto h-16 w-16 text-ocean-blue/30 mb-4" />
              <h3 className="text-xl font-bold text-deep-navy mb-2">No listings found</h3>
              <p className="text-ink/70">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="group overflow-hidden rounded-xl bg-white shadow-sm border border-ocean-blue/10 transition-all hover:shadow-lg hover:-translate-y-1 relative">
                  <button onClick={(e) => handleLike(listing.id, e)} className="absolute top-3 right-3 z-10 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition-colors group/btn">
                    <Heart size={18} className={`transition-colors ${listing.is_liked_by_visitor ? "text-red-500 fill-red-500" : "text-ink/60 group-hover/btn:text-red-500"}`} />
                  </button>

                  <div className="relative h-48 sm:h-56 bg-mist-white overflow-hidden">
                    {listing.primary_image_url ? (
                      <img src={listing.primary_image_url} alt={listing.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ocean-blue/10 to-teal-500/10"><Home className="h-16 w-16 text-ocean-blue/30" /></div>
                    )}
                    <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-deep-navy capitalize">{listing.category}</div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-deep-navy text-lg line-clamp-1">{listing.title}</h3>
                      <p className="text-sm text-amber-gold font-semibold line-clamp-1">{listing.property_name}</p>
                      <div className="flex items-center gap-1 text-sm text-ink/70 mt-1">
                        <MapPin size={14} /><span className="line-clamp-1">{listing.estate}, {listing.county}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-ink/60 py-2 border-y border-ocean-blue/10">
                      <div className="flex items-center gap-1"><Bed size={14} /><span>{listing.bedrooms} Beds</span></div>
                      <div className="flex items-center gap-1"><Bath size={14} /><span>{listing.bathrooms} Baths</span></div>
                      {listing.parking && <div className="flex items-center gap-1"><Car size={14} /><span>Parking</span></div>}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-xs text-ink/60">{listing.category === "rental" ? "Monthly Rent" : "Price"}</p>
                        <p className="text-xl font-bold text-ocean-blue">KES {listing.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/listings/${listing.id}`} className="px-4 py-2 bg-deep-navy text-white text-sm font-semibold rounded-lg hover:bg-ocean-blue transition-colors">View</Link>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-chat", { detail: { listingId: listing.id, landlordId: listing.landlord_id } })); }} className="p-2 border border-ocean-blue/20 text-ocean-blue rounded-lg hover:bg-ocean-blue/5 transition-colors" title="Chat with Landlord">
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-ink/50 pt-2">
                      <Heart size={12} className={listing.is_liked_by_visitor ? "fill-red-500 text-red-500" : "fill-ink/50"} />
                      <span>{listing.likes_count} {listing.likes_count === 1 ? "like" : "likes"}</span>
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
            <p className="text-sm font-bold text-white">HomePlace<span className="text-amber-gold">254</span></p>
            <p className="text-xs text-white/50 mt-0.5">Your Link to Your Next Home</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="#listings" className="hover:text-white transition-colors">Listings</Link>
          </div>
          <div className="text-center md:text-right text-white/40 text-xs">
            <p>&copy; 2026 HomePlace254. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}