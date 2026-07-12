"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { ArrowLeft, Save, Home, MapPin, Bed, Bath, Car, DollarSign, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    category: "rental",
    sub_category: "apartment",
    price: "",
    bedrooms: "",
    bathrooms: "",
    parking: false,
    primary_image_url: "",
    status: "available"
  });

  // Fetch properties for dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) return;
      
      const { data } = await supabaseAuth
        .from("properties")
        .select("id, name")
        .eq("landlord_id", user.id);
      
      if (data) setProperties(data);
    };
    fetchProperties();
  }, []);

  // Fetch existing listing data
  useEffect(() => {
    const fetchListing = async () => {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) return;

      const { data, error } = await supabaseAuth
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("landlord_id", user.id) // Security: only allow editing own listings
        .single();

      if (error || !data) {
        alert("Listing not found or you don't have permission to edit it.");
        router.push("/landlord/listings");
        return;
      }

      setFormData({
        property_id: data.property_id || "",
        title: data.title || "",
        description: data.description || "",
        category: data.category || "rental",
        sub_category: data.sub_category || "apartment",
        price: data.price?.toString() || "",
        bedrooms: data.bedrooms?.toString() || "",
        bathrooms: data.bathrooms?.toString() || "",
        parking: data.parking || false,
        primary_image_url: data.primary_image_url || "",
        status: data.status || "available"
      });
      setLoading(false);
    };

    fetchListing();
  }, [listingId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabaseAuth
      .from("listings")
      .update({
        property_id: formData.property_id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        sub_category: formData.sub_category,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        parking: formData.parking,
        primary_image_url: formData.primary_image_url,
        status: formData.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", listingId);

    if (error) {
      alert("Error updating listing: " + error.message);
    } else {
      alert("Listing updated successfully!");
      router.push("/landlord/listings");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-deep-navy">Loading listing details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/landlord/listings" className="p-2 hover:bg-mist-white rounded-full transition-colors">
          <ArrowLeft size={24} className="text-deep-navy" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-deep-navy">Edit Listing</h1>
          <p className="text-sm text-ink/70">Update details for this rental unit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-ocean-blue/10 p-8 space-y-6">
        
        {/* Property Selection */}
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

        {/* Title & Description */}
        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-2">Listing Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Spacious 2BR Apartment with City View"
            className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the unit, neighborhood, and key features..."
            className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue resize-none"
          />
        </div>

        {/* Category & Sub-category */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue"
            >
              <option value="rental">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Unit Type</label>
            <select
              name="sub_category"
              value={formData.sub_category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
              <option value="townhouse">Townhouse</option>
              <option value="villa">Villa</option>
            </select>
          </div>
        </div>

        {/* Price & Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Price (KES)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue"
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        {/* Bedrooms, Bathrooms, Parking */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Bedrooms</label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                min="0"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Bathrooms</label>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                min="0"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
              />
            </div>
          </div>
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="parking"
                checked={formData.parking}
                onChange={handleChange}
                className="w-5 h-5 rounded border-ocean-blue/30 text-ocean-blue focus:ring-ocean-blue"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-deep-navy">
                <Car size={18} /> Parking Available
              </span>
            </label>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-2">Primary Image URL</label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
            <input
              type="url"
              name="primary_image_url"
              value={formData.primary_image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            />
          </div>
          {formData.primary_image_url && (
            <div className="mt-3 h-32 w-full rounded-lg overflow-hidden border border-ocean-blue/10">
              <img src={formData.primary_image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-ocean-blue/10">
          <Link 
            href="/landlord/listings" 
            className="px-6 py-2.5 rounded-lg text-ink/70 hover:bg-mist-white font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2.5 bg-amber-gold text-white rounded-lg font-bold hover:brightness-90 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving Changes..." : "Update Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}