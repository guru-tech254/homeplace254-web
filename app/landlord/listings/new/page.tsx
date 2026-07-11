"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Upload, Loader2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  estate: string;
}

export default function AddListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    category: "rental",
    sub_category: "1_bedroom",
    price: "",
    bedrooms: "1",
    bathrooms: "1",
    parking: false,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    const { data } = await supabaseAuth
      .from("properties")
      .select("id, name, estate")
      .eq("landlord_id", user.id);

    if (data) setProperties(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload image
      let imageUrl = "";
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabaseAuth.storage
          .from("property-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseAuth.storage.from("property-images").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // Insert listing
      const { error } = await supabaseAuth.from("listings").insert({
        property_id: formData.property_id,
        landlord_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        sub_category: formData.sub_category,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        parking: formData.parking,
        primary_image_url: imageUrl,
        status: "available",
      });

      if (error) throw error;

      alert("Listing added successfully!");
      router.push("/landlord/listings");
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-deep-navy">Add New Listing</h1>
      <p className="mb-8 text-ink/70">Add an individual unit/listing to one of your properties.</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Select Property</label>
          <select
            required
            value={formData.property_id}
            onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
          >
            <option value="">Choose a property...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.estate}</option>
            ))}
          </select>
          {properties.length === 0 && (
            <p className="mt-2 text-xs text-red-600">No properties found. Create a property first.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Listing Title</label>
          <input
            type="text"
            required
            placeholder="e.g., Unit 1A - 2 Bedroom"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
            >
              <option value="rental">Rental</option>
              <option value="sale">For Sale</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Type</label>
            <select
              value={formData.sub_category}
              onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
              className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none"
            >
              <option value="bedsitter">Bedsitter</option>
              <option value="1_bedroom">1 Bedroom</option>
              <option value="2_bedroom">2 Bedrooms</option>
              <option value="3_bedroom">3+ Bedrooms</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Price (KES)</label>
          <input
            type="number"
            required
            placeholder="25000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Bedrooms</label>
            <input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Bathrooms</label>
            <input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.parking} onChange={(e) => setFormData({ ...formData, parking: e.target.checked })} className="h-4 w-4 rounded border-ocean-blue/20 text-ocean-blue focus:ring-ocean-blue" />
              <span className="text-sm font-semibold text-deep-navy">Parking Available</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Description</label>
          <textarea
            rows={4}
            required
            placeholder="Describe the unit, amenities, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white px-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Listing Image</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-ocean-blue/30 rounded-lg cursor-pointer bg-mist-white hover:bg-ocean-blue/5 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-ocean-blue/50" />
                <p className="mb-2 text-sm text-ink/70"><span className="font-semibold">Click to upload</span></p>
                <p className="text-xs text-ink/50">PNG, JPG or WEBP (MAX. 5MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          {imageFile && <p className="mt-2 text-xs text-signal-green font-medium">Selected: {imageFile.name}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || properties.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-gold py-3.5 text-base font-bold text-white transition-all hover:brightness-90 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Publishing Listing...</> : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}