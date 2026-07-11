import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Bath, Car, CheckCircle2, MessageCircle, Phone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
interface Property {
  id: string;
  name: string;
  address: string;
  estate: string;
  county: string;
  landlord_id: string;
  amenities: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}
export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !property) return notFound();

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: property.currency || "KES",
    maximumFractionDigits: 0,
  }).format(property.price);

  const amenities = (property.amenities as any) || {};

  return (
    <div className="min-h-screen bg-mist-white">
      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-deep-navy hover:text-ocean-blue transition-colors">
          <ArrowLeft size={16} />
          Back to Listings
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Image */}
          <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-ocean-blue/10">
            <Image
              src={property.primary_image_url || "/placeholder-property.jpg"}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
            {property.is_verified && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-lg bg-signal-green px-3 py-1.5 text-sm font-bold text-white shadow-md">
                <CheckCircle2 size={16} />
                VERIFIED LISTING
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">{property.title}</h1>
              <div className="mt-2 flex items-center gap-1.5 text-ocean-blue">
                <MapPin size={18} />
                <span>{property.address}, {property.estate}, {property.county}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-gold">{formattedPrice}</div>
          </div>

          {/* Amenities Grid */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
            <h2 className="mb-4 text-lg font-bold text-deep-navy">Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {amenities.bedrooms && (
                <div className="flex items-center gap-3 rounded-lg bg-mist-white p-3">
                  <Bed size={20} className="text-deep-navy" />
                  <span className="text-sm font-medium text-ink">{amenities.bedrooms} Bedrooms</span>
                </div>
              )}
              {amenities.bathrooms && (
                <div className="flex items-center gap-3 rounded-lg bg-mist-white p-3">
                  <Bath size={20} className="text-deep-navy" />
                  <span className="text-sm font-medium text-ink">{amenities.bathrooms} Bathrooms</span>
                </div>
              )}
              {amenities.parking && (
                <div className="flex items-center gap-3 rounded-lg bg-mist-white p-3">
                  <Car size={20} className="text-deep-navy" />
                  <span className="text-sm font-medium text-ink">Parking Available</span>
                </div>
              )}
              {amenities.water && (
                <div className="flex items-center gap-3 rounded-lg bg-mist-white p-3">
                  <CheckCircle2 size={20} className="text-deep-navy" />
                  <span className="text-sm font-medium text-ink">Water Supply</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
            <h2 className="mb-4 text-lg font-bold text-deep-navy">Description</h2>
            <p className="whitespace-pre-line text-ink/80 leading-relaxed">
              {property.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky CTA Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl bg-white p-6 shadow-lg border border-ocean-blue/10">
            <h3 className="mb-4 text-lg font-bold text-deep-navy">Interested in this property?</h3>
            <p className="mb-6 text-sm text-ink/70">Contact the landlord directly to schedule a viewing or ask questions.</p>
            
            <div className="space-y-3">
              <Link 
                href={`/chat?propertyId=${property.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-deep-navy py-3.5 text-base font-bold text-white transition-all hover:bg-ocean-blue hover:shadow-md"
              >
                <MessageCircle size={20} />
                Chat with Landlord
              </Link>
              
              <a
                href={`https://wa.me/?text=Hi, I'm interested in ${encodeURIComponent(property.title)} (${formattedPrice}) listed on HomePlace254`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-signal-green py-3.5 text-base font-bold text-white transition-all hover:brightness-90 hover:shadow-md"
              >
                <Phone size={20} />
                WhatsApp
              </a>
            </div>

            <div className="mt-6 border-t border-ocean-blue/10 pt-4 text-center">
              <p className="text-xs text-ink/50">Your link to your next home</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}