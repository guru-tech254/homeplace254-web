"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Upload, X, Save, Image as ImageIcon, Loader2, Camera } from "lucide-react";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    parking: "false",
    status: "available",
    primary_image_url: ""
  });

  // 1. Fetch existing data AND set initial preview
  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const { data, error } = await supabaseAuth
          .from("listings")
          .select("*")
          .eq("id", listingId)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title || "",
            description: data.description || "",
            price: String(data.price || ""),
            bedrooms: String(data.bedrooms || ""),
            bathrooms: String(data.bathrooms || ""),
            parking: String(data.parking || false),
            status: data.status || "available",
            primary_image_url: data.primary_image_url || ""
          });
          
          setPreviewUrl(data.primary_image_url || "");
        }
      } catch (err) {
        console.error("Failed to fetch listing:", err);
        alert("Could not load listing details.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  // 2. INSTANT LOCAL PREVIEW FROM DEVICE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      
      return () => URL.revokeObjectURL(localUrl);
    }
  };

  // 3. Convert to Base64 ONLY when saving
  const handleUpdateListing = async () => {
    if (!listingId) return;
    setSaving(true);

    try {
      let finalImageUrl = formData.primary_image_url;

      // Only convert if user selected a NEW file from device
      if (imageFile) {
        // ✅ UPDATED: Increased limit from 500KB to 10MB
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        
        if (imageFile.size > MAX_FILE_SIZE) {
          alert("Image must be under 10MB for direct storage.");
          setSaving(false);
          return;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        if (!base64.startsWith("data:image")) {
          throw new Error("Invalid image format");
        }

        finalImageUrl = base64;
      }

      // Save to database
      const { error: updateError } = await supabaseAuth
        .from("listings")
        .update({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          parking: formData.parking === "true",
          status: formData.status,
          primary_image_url: finalImageUrl,
        })
        .eq("id", listingId);

      if (updateError) throw updateError;

      alert("✅ Listing updated successfully!");
      router.push("/landlord/listings");
      
    } catch (err: any) {
      console.error("❌ Update failed:", err);
      alert(`Error updating listing: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-ocean-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-deep-navy">Edit Listing</h1>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink/70 hover:text-deep-navy transition-colors"
        >
          <X size={16} /> Cancel
        </button>
      </div>

      {/* IMAGE UPLOAD WITH INSTANT PREVIEW */}
      <div className="bg-white rounded-xl border border-ocean-blue/10 p-6 shadow-sm">
        <label className="block text-sm font-semibold text-deep-navy mb-4">
          Listing Photo
        </label>
        
        <div className="relative group cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${
            previewUrl ? "border-ocean-blue bg-mist-white" : "border-ocean-blue/30 hover:border-ocean-blue hover:bg-mist-white/50"
          }`}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Listing Preview" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <>
                <Camera size={32} className="text-ocean-blue/50 mb-2" />
                <p className="text-sm text-ink/60">Click to upload from device</p>
              </>
            )}
            
            {previewUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={24} className="text-white" />
                <span className="text-white ml-2 font-medium">Change Photo</span>
              </div>
            )}
          </div>
        </div>
        
        {imageFile && (
          <p className="text-xs text-ocean-blue mt-2 flex items-center gap-1">
            <ImageIcon size={12} /> 
            New image selected: {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-xl border border-ocean-blue/10 p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-2">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Price (KES)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Bedrooms</label>
            <input
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Bathrooms</label>
            <input
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Parking</label>
            <select
              value={formData.parking}
              onChange={(e) => setFormData({...formData, parking: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue"
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={() => router.back()}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg font-semibold text-ink/70 hover:text-deep-navy transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateListing}
          disabled={saving || !formData.title || !formData.price}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-gold text-white font-semibold hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Updating..." : "Update Listing"}
        </button>
      </div>
    </div>
  );
}