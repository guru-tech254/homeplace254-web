"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Building2, Users, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

interface PropertyWithStats {
  id: string;
  name: string;
  estate: string;
  county: string;
  total_units: number;
  active_tenants: number;
  occupancy_rate: number;
}

export default function PropertiesOverviewPage() {
  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    // Get all properties
    const { data: propsData } = await supabaseAuth
      .from("properties")
      .select("id, name, estate, county, total_units")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (!propsData) {
      setLoading(false);
      return;
    }

    // For each property, count active tenants
    const propertiesWithStats = await Promise.all(
      propsData.map(async (prop) => {
        const { count } = await supabaseAuth
          .from("tenants")
          .select("*", { count: "exact", head: true })
          .eq("landlord_id", user.id)
          .eq("status", "active");

        const activeTenants = count || 0;
        const totalUnits = prop.total_units || 1;
        const occupancyRate = Math.round((activeTenants / totalUnits) * 100);

        return {
          ...prop,
          active_tenants: activeTenants,
          occupancy_rate: occupancyRate,
        };
      })
    );

    setProperties(propertiesWithStats);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-deep-navy">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-navy md:text-3xl">My Properties</h1>
          <p className="mt-1 text-ink/70">Manage buildings, track occupancy, and oversee tenants.</p>
        </div>
        <Link
          href="/landlord/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-blue"
        >
          <Plus size={16} /> Add New Property
        </Link>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-ocean-blue/10">
          <Building2 className="mx-auto h-16 w-16 text-ocean-blue/30 mb-4" />
          <h2 className="text-xl font-bold text-deep-navy mb-2">No Properties Registered</h2>
          <p className="text-ink/70 mb-6">Register your first building or apartment complex to start managing tenants.</p>
          <Link
            href="/landlord/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-gold px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-90"
          >
            + Register Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/landlord/properties/${property.id}`}
              className="group rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md hover:border-amber-gold/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-lg bg-deep-navy/10 p-3 text-deep-navy group-hover:bg-amber-gold/10 group-hover:text-amber-gold transition-colors">
                  <Building2 size={24} />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  property.occupancy_rate >= 80 
                    ? "bg-signal-green/10 text-signal-green" 
                    : property.occupancy_rate >= 50 
                      ? "bg-amber-gold/10 text-amber-gold" 
                      : "bg-red-500/10 text-red-500"
                }`}>
                  {property.occupancy_rate}% Occupied
                </span>
              </div>

              <h3 className="font-bold text-deep-navy text-lg line-clamp-1">{property.name}</h3>
              <p className="text-sm text-ink/70 mt-1">{property.estate}, {property.county}</p>

              <div className="mt-4 pt-4 border-t border-ocean-blue/10 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-ink/70">
                  <Users size={14} />
                  <span>{property.active_tenants} / {property.total_units} units</span>
                </div>
                <ArrowRight size={16} className="text-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}