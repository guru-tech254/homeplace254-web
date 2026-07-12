"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { ArrowLeft, Save, UserPlus, Home, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
}

function NewTenantFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    property_id: searchParams.get("propertyId") || "",
    listing_id: "",
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    move_in_date: "",
    monthly_rent: "",
    deposit: "",
  });

  // ✅ FIX: Functions declared BEFORE useEffect
  const fetchProperties = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    const { data } = await supabaseAuth
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id);
    
    if (data) setProperties(data);
  };

  const fetchListings = async (propertyId: string) => {
    const { data } = await supabaseAuth
      .from("listings")
      .select("id, title, price")
      .eq("property_id", propertyId)
      .eq("status", "available");
    
    if (data) {
      setListings(data);
      // Auto-fill rent if a listing is selected or if only one is available
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, listing_id: data[0].id, monthly_rent: data[0].price.toString() }));
      }
    } else {
      setListings([]);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.property_id) {
      fetchListings(formData.property_id);
    }
  }, [formData.property_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If property changes, reset listing
    if (name === "property_id") {
      setFormData(prev => ({ ...prev, [name]: value, listing_id: "", monthly_rent: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      alert("You must be logged in as a landlord.");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabaseAuth.from("tenants").insert({
        landlord_id: user.id,
        property_id: formData.property_id,
        listing_id: formData.listing_id || null,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        id_number: formData.id_number,
        move_in_date: formData.move_in_date,
        monthly_rent: Number(formData.monthly_rent),
        deposit: Number(formData.deposit),
        status: "active"
      });

      if (error) throw error;

      alert("Tenant added successfully!");
      router.push("/landlord/tenants");
    } catch (err: any) {
      alert("Error adding tenant: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/landlord/tenants" className="p-2 hover:bg-mist-white rounded-full transition-colors">
          <ArrowLeft size={24} className="text-deep-navy" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-deep-navy">Add New Tenant</h1>
          <p className="text-sm text-ink/70">Register a new tenant to a property unit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-ocean-blue/10 p-8 space-y-6">
        
        {/* Property & Unit Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Property</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <select
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue"
              >
                <option value="">Select a Property</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Unit / Listing</label>
            <select
              name="listing_id"
              value={formData.listing_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue disabled:opacity-50"
              disabled={!formData.property_id}
            >
              <option value="">Select a Unit (Optional)</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>{l.title} (KES {l.price.toLocaleString()})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Details */}
        <div className="border-t border-ocean-blue/10 pt-6">
          <h3 className="text-lg font-bold text-deep-navy mb-4 flex items-center gap-2">
            <UserPlus size={20} /> Personal Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">ID / Passport Number</label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
          </div>
        </div>

        {/* Financial & Move-in Details */}
        <div className="border-t border-ocean-blue/10 pt-6">
          <h3 className="text-lg font-bold text-deep-navy mb-4 flex items-center gap-2">
            <DollarSign size={20} /> Lease Details
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Monthly Rent (KES)</label>
              <input
                type="number"
                name="monthly_rent"
                value={formData.monthly_rent}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Deposit (KES)</label>
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Move-in Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
                <input
                  type="date"
                  name="move_in_date"
                  value={formData.move_in_date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-ocean-blue/10">
          <Link 
            href="/landlord/tenants" 
            className="px-6 py-2.5 rounded-lg text-ink/70 hover:bg-mist-white font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-amber-gold text-white rounded-lg font-bold hover:brightness-90 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? "Saving..." : "Save Tenant"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewTenantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-deep-navy">Loading form...</div>}>
      <NewTenantFormContent />
    </Suspense>
  );
}