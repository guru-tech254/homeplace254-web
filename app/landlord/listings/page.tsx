"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Home, Plus, Edit2, Trash2, MapPin, Bed, Bath, Search, Filter } from "lucide-react";
import Link from "next/link";

interface ListingWithProperty {
  id: string;
  title: string;
  category: string;
  sub_category: string;
  price: number;
  status: string;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  primary_image_url: string;
  created_at: string;
  property_id: string; // Added this
  properties: {
    name: string;
    estate: string;
    county: string;
  } | null;
}

export default function LandlordListingsPage() {
  const [listings, setListings] = useState<ListingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ FIX: Functions declared BEFORE useEffect
  const fetchListings = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    try {
      // Step 1: Fetch basic listing data without nested joins
      const { data, error } = await supabaseAuth
        .from("listings")
        .select(`
          id,
          title,
          category,
          sub_category,
          price,
          status,
          bedrooms,
          bathrooms,
          parking,
          primary_image_url,
          created_at,
          property_id
        `)
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        setLoading(false);
        return;
      }

      // Step 2: Enrich each listing with property details
      const enrichedListings = await Promise.all(
        (data || []).map(async (listing) => {
          let propertyData = null;
          
          if (listing.property_id) {
            const { data: prop } = await supabaseAuth
              .from("properties")
              .select("name, estate, county")
              .eq("id", listing.property_id)
              .single();
            
            propertyData = prop;
          }

          return {
            ...listing,
            properties: propertyData
          };
        })
      );

      setListings(enrichedListings);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    const { error } = await supabaseAuth.from("listings").delete().eq("id", id);

    if (error) {
      alert("Error deleting listing: " + error.message);
    } else {
      setListings(listings.filter(l => l.id !== id));
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-deep-navy">Loading listings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep-navy md:text-3xl">My Listings</h1>
          <p className="mt-1 text-ink/70">Manage all your rental units in one place.</p>
        </div>
        <Link
          href="/landlord/listings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-90"
        >
          <Plus size={16} /> Add New Listing
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by unit title or property name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-ocean-blue/20 bg-white pl-10 pr-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-ink/60" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-ocean-blue/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-ocean-blue/10">
          <Home className="mx-auto h-16 w-16 text-ocean-blue/30 mb-4" />
          <h3 className="text-lg font-bold text-deep-navy mb-2">No listings found</h3>
          <p className="text-ink/70 mb-6">Try adjusting your filters or add a new listing.</p>
          <Link
            href="/landlord/listings/new"
            className="text-ocean-blue font-semibold hover:underline"
          >
            Add Your First Listing →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="group overflow-hidden rounded-xl bg-white shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-48 bg-mist-white overflow-hidden">
                {listing.primary_image_url ? (
                  <img
                    src={listing.primary_image_url}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-ocean-blue/10 to-teal-500/10">
                    <Home className="h-12 w-12 text-ocean-blue/30" />
                  </div>
                )}
                <div className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  listing.status === 'available' 
                    ? 'bg-signal-green/90 text-white' 
                    : listing.status === 'rented'
                    ? 'bg-deep-navy/90 text-white'
                    : 'bg-amber-gold/90 text-white'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-deep-navy line-clamp-1">{listing.title}</h3>
                  <p className="text-xs text-amber-gold font-semibold mt-1">
                    {listing.properties?.name || "Unknown Property"}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-ink/70 mt-1">
                    <MapPin size={14} />
                    <span className="line-clamp-1">
                      {listing.properties?.estate}, {listing.properties?.county}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-3 text-xs text-ink/60 py-2 border-y border-ocean-blue/10">
                  <div className="flex items-center gap-1">
                    <Bed size={14} />
                    <span>{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath size={14} />
                    <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                  {listing.parking && (
                    <div className="flex items-center gap-1">
                      <Home size={14} />
                      <span>Parking</span>
                    </div>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-xs text-ink/60">Monthly Rent</p>
                    <p className="text-lg font-bold text-ocean-blue">
                      KES {Number(listing.price).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
  href={`/landlord/listings/${listing.id}/edit`}
  className="p-2 rounded-lg text-ink/60 hover:bg-mist-white hover:text-deep-navy transition-colors"
  title="Edit Listing"
>
  <Edit2 size={16} />
</Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 size={16} />
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