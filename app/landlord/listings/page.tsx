"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { 
  Search, Filter, Edit3, Trash2, Plus, 
  MapPin, Bed, Bath, Home, Loader2, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  status: string;
  primary_image_url: string | null; // Now holds Base64 string or null
  property_id: string;
  property?: { name: string; estate: string; county: string };
}

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch listings with property details
  const fetchListings = async () => {
    try {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) return;

      const { data: listingsData, error: listingsError } = await supabaseAuth
        .from("listings")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;

      // Enrich with property details
      const enriched = await Promise.all(
        (listingsData || []).map(async (listing) => {
          let property = null;
          if (listing.property_id) {
            const { data: propData } = await supabaseAuth
              .from("properties")
              .select("name, estate, county")
              .eq("id", listing.property_id)
              .single();
            property = propData;
          }
          return { ...listing, property };
        })
      );

      setListings(enriched);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const { error } = await supabaseAuth.from("listings").delete().eq("id", id);
      if (error) throw error;
      
      setListings(prev => prev.filter(l => l.id !== id));
      alert("Listing deleted successfully");
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Client-side filtering
  const filtered = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-ocean-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-deep-navy">My Listings</h1>
        <Link 
          href="/landlord/listings/new"
          className="inline-flex items-center gap-2 bg-amber-gold text-white px-5 py-2.5 rounded-lg font-semibold hover:brightness-90 transition-all"
        >
          <Plus size={18} /> Create New Listing
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-ocean-blue/10 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by unit title or property name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue appearance-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ocean-blue/10">
          <AlertCircle className="mx-auto h-12 w-12 text-ocean-blue/30 mb-4" />
          <h3 className="text-lg font-bold text-deep-navy mb-2">No listings found</h3>
          <p className="text-ink/60 mb-6">Try adjusting your search or create a new listing.</p>
          <Link 
            href="/landlord/listings/new"
            className="inline-flex items-center gap-2 bg-ocean-blue text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-deep-navy transition-all"
          >
            <Plus size={18} /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((listing) => (
            <div key={listing.id} className="group bg-white rounded-xl border border-ocean-blue/10 shadow-sm overflow-hidden hover:shadow-md transition-all">
              
              {/* ✅ BASE64 COMPATIBLE IMAGE RENDERING */}
              <div className="relative aspect-[4/3] bg-mist-white overflow-hidden">
                {listing.primary_image_url ? (
                  <img 
                    src={listing.primary_image_url} // Works with both HTTP URLs and Base64 strings
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ocean-blue/30 bg-gray-50">
                    <Home size={48} />
                    <span className="text-xs mt-2 font-medium">No Image</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                  listing.status === 'available' ? 'bg-signal-green' :
                  listing.status === 'rented' ? 'bg-ocean-blue' : 'bg-amber-gold'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-deep-navy text-lg line-clamp-1">{listing.title}</h3>
                  <p className="text-sm text-amber-gold font-medium line-clamp-1">
                    {listing.property?.name || "Unknown Property"}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-ink/60 mt-1">
                    <MapPin size={12} />
                    <span className="line-clamp-1">
                      {listing.property?.estate}, {listing.property?.county}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-4 text-xs text-ink/60 py-2 border-y border-ocean-blue/5">
                  <div className="flex items-center gap-1"><Bed size={14} /><span>{listing.bedrooms} beds</span></div>
                  <div className="flex items-center gap-1"><Bath size={14} /><span>{listing.bathrooms} bath</span></div>
                  {listing.parking && <div className="flex items-center gap-1"><Home size={14} /><span>Parking</span></div>}
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs text-ink/50">Monthly Rent</p>
                    <p className="text-xl font-bold text-ocean-blue">KES {listing.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/landlord/listings/${listing.id}/edit`)}
                      className="p-2 text-ink/60 hover:text-ocean-blue hover:bg-ocean-blue/5 rounded-lg transition-colors"
                      title="Edit Listing"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-2 text-ink/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}