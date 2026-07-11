"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: string; // 'available' or 'rented'
}

export default function AddTenantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPropertyId = searchParams.get("property_id");

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [formData, setFormData] = useState({
    property_id: preselectedPropertyId || "",
    listing_id: "",
    tenant_email: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.property_id) {
      fetchListings(formData.property_id);
    } else {
      setListings([]);
    }
  }, [formData.property_id]);

  const fetchProperties = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    const { data } = await supabaseAuth
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id)
      .order("name");

    if (data) setProperties(data);
  };

  const fetchListings = async (propertyId: string) => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    // Only show available listings for tenant assignment
    const { data } = await supabaseAuth
      .from("listings")
      .select("id, title, price, bedrooms, bathrooms, status")
      .eq("property_id", propertyId)
      .eq("landlord_id", user.id)
      .eq("status", "available")
      .order("title");

    if (data) setListings(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user: landlordUser } } = await supabaseAuth.auth.getUser();
      if (!landlordUser) throw new Error("Not authenticated");

      // Find or create tenant user by email
      // Note: In production, you'd want a proper user lookup/creation flow
      // For now, we'll assume the tenant already exists in auth.users
      const { data: tenantUsers } = await supabaseAuth
        .from("users")
        .select("id")
        .eq("email", formData.tenant_email)
        .single();

      if (!tenantUsers) {
        throw new Error(`No user found with email: ${formData.tenant_email}. Tenant must be registered first.`);
      }

      const selectedListing = listings.find(l => l.id === formData.listing_id);
      if (!selectedListing) throw new Error("Invalid listing selected");

      // Insert tenant record
      const { error } = await supabaseAuth.from("tenants").insert({
        user_id: tenantUsers.id,
        listing_id: formData.listing_id,
        landlord_id: landlordUser.id,
        lease_start: formData.lease_start,
        lease_end: formData.lease_end,
        monthly_rent: parseFloat(formData.monthly_rent) || selectedListing.price,
        status: "active",
      });

      if (error) throw error;

      // Update listing status to rented
      await supabaseAuth
        .from("listings")
        .update({ status: "rented" })
        .eq("id", formData.listing_id);

      alert("Tenant registered successfully!");
      
      // Redirect back to the property detail page if preselected, otherwise to tenants list
      if (preselectedPropertyId) {
        router.push(`/landlord/properties/${preselectedPropertyId}`);
      } else {
        router.push("/landlord/tenants");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-6">
      <Link 
        href={preselectedPropertyId ? `/landlord/properties/${preselectedPropertyId}` : "/landlord/tenants"} 
        className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-deep-navy mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      
      <h1 className="mb-2 text-2xl font-bold text-deep-navy">Register New Tenant</h1>
      <p className="mb-8 text-ink/70">Assign an existing user to a rental unit.</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
        
        {/* Property Selection */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Select Property *</label>
          <select 
            required 
            value={formData.property_id} 
            onChange={(e) => setFormData({ ...formData, property_id: e.target.value, listing_id: "" })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          >
            <option value="">Choose a property...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {properties.length === 0 && (
            <p className="mt-2 text-xs text-red-600">No properties found. Create a property first.</p>
          )}
        </div>

        {/* Listing/Unit Selection */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Select Unit *</label>
          <select 
            required 
            value={formData.listing_id} 
            onChange={(e) => {
              const selected = listings.find(l => l.id === e.target.value);
              setFormData({ 
                ...formData, 
                listing_id: e.target.value,
                monthly_rent: selected ? String(selected.price) : ""
              });
            }} 
            disabled={!formData.property_id}
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue disabled:opacity-50"
          >
            <option value="">Choose a unit...</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} - {l.bedrooms} bed, {l.bathrooms} bath - KES {Number(l.price).toLocaleString()}
              </option>
            ))}
          </select>
          {!formData.property_id && (
            <p className="mt-2 text-xs text-ink/60">Select a property first to see available units.</p>
          )}
          {formData.property_id && listings.length === 0 && (
            <p className="mt-2 text-xs text-amber-gold">No available units in this property. All units are currently rented.</p>
          )}
        </div>

        {/* Tenant Email */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Tenant Email *</label>
          <input 
            type="email" 
            required 
            placeholder="tenant@example.com" 
            value={formData.tenant_email} 
            onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
          <p className="mt-1 text-xs text-ink/60">The tenant must already have a registered account on HomePlace254.</p>
        </div>

        {/* Lease Dates */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Lease Start Date *</label>
            <input 
              type="date" 
              required 
              value={formData.lease_start} 
              onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })} 
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Lease End Date *</label>
            <input 
              type="date" 
              required 
              min={formData.lease_start}
              value={formData.lease_end} 
              onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })} 
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
            />
          </div>
        </div>

        {/* Monthly Rent */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Monthly Rent (KES) *</label>
          <input 
            type="number" 
            required 
            min="0"
            placeholder={listings.find(l => l.id === formData.listing_id)?.price.toString() || "Enter rent amount"}
            value={formData.monthly_rent} 
            onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
          <p className="mt-1 text-xs text-ink/60">Pre-filled from listing price. You can adjust if needed.</p>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading || !formData.property_id || !formData.listing_id} 
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-deep-navy py-3.5 text-base font-bold text-white transition-all hover:bg-ocean-blue disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> 
              Registering Tenant...
            </>
          ) : (
            <>
              <UserPlus size={18} /> 
              Register Tenant
            </>
          )}
        </button>
      </form>
    </div>
  );
}