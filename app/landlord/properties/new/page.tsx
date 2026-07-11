"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    county: "Nairobi",
    estate: "",
    total_units: "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert ONLY into the 'properties' table (the parent building)
      const { error } = await supabaseAuth.from("properties").insert({
        landlord_id: user.id,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        county: formData.county,
        estate: formData.estate,
        total_units: parseInt(formData.total_units),
      });

      if (error) throw error;

      alert("Property created successfully! Now you can add listings to it.");
      // Redirect back to the My Properties page
      router.push("/landlord/properties");
    } catch (error: any) {
      console.error(error);
      alert(`Error creating property: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-6">
      {/* Back Button */}
      <Link 
        href="/landlord/properties" 
        className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-deep-navy mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Properties
      </Link>
      
      <h1 className="mb-2 text-2xl font-bold text-deep-navy">Add New Property</h1>
      <p className="mb-8 text-ink/70">Register a building or complex. Once created, you can add individual rental units (listings) to it.</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
        
        {/* Property Name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Property Name *</label>
          <input 
            type="text" 
            required 
            placeholder="e.g., Riara Apartments, Kilimani Heights" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Description</label>
          <textarea 
            rows={3} 
            placeholder="Brief description of the building amenities, security, etc." 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
          />
        </div>

        {/* Location Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">County *</label>
            <input 
              type="text" 
              required 
              placeholder="Nairobi" 
              value={formData.county} 
              onChange={(e) => setFormData({ ...formData, county: e.target.value })} 
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Estate / Neighborhood *</label>
            <input 
              type="text" 
              required 
              placeholder="Kilimani" 
              value={formData.estate} 
              onChange={(e) => setFormData({ ...formData, estate: e.target.value })} 
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
            />
          </div>
        </div>

        {/* Full Address */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Full Address *</label>
          <input 
            type="text" 
            required 
            placeholder="Argwings Kodhek Rd, Near Yaya Centre" 
            value={formData.address} 
            onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
          />
        </div>

        {/* Total Units */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Total Units *</label>
          <input 
            type="number" 
            min="1" 
            required 
            placeholder="10" 
            value={formData.total_units} 
            onChange={(e) => setFormData({ ...formData, total_units: e.target.value })} 
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" 
          />
          <p className="mt-1 text-xs text-ink/60">How many individual rental units are in this property?</p>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-deep-navy py-3.5 text-base font-bold text-white transition-all hover:bg-ocean-blue disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> 
              Creating Property...
            </>
          ) : (
            <>
              <Building2 size={18} /> 
              Create Property
            </>
          )}
        </button>
      </form>
    </div>
  );
}