"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { UserPlus, Search } from "lucide-react";
import Link from "next/link";

interface TenantWithDetails {
  id: string;
  user_id: string;
  listing_id: string;
  monthly_rent: number;
  lease_start: string;
  lease_end: string;
  status: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
  listing: {
    title: string;
    properties: {
      name: string;
    } | null;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

      const fetchTenants = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    // SIMPLIFIED QUERY - No nested joins
    const { data, error } = await supabaseAuth
      .from("tenants")
      .select(`
        id,
        user_id,
        listing_id,
        monthly_rent,
        lease_start,
        lease_end,
        status
      `)
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tenants:", error);
    } else {
      // Fetch additional details separately
      const tenantsWithDetails = await Promise.all(
        (data || []).map(async (tenant) => {
          // Fetch user details
          const { data: userData } = await supabaseAuth
            .from("users")
            .select("full_name, email, phone")
            .eq("id", tenant.user_id)
            .single();

          // Fetch listing details
          const { data: listingData } = await supabaseAuth
            .from("listings")
            .select("title, property_id")
            .eq("id", tenant.listing_id)
            .single();

          // Fetch property details
          let propertyData = null;
          if (listingData?.property_id) {
            const { data: propData } = await supabaseAuth
              .from("properties")
              .select("name")
              .eq("id", listingData.property_id)
              .single();
            propertyData = propData;
          }

          return {
            ...tenant,
            user: userData,
            listing: {
              title: listingData?.title,
              properties: { name: propertyData?.name }
            }
          };
        })
      );

      setTenants(tenantsWithDetails);
    }
    setLoading(false);
  };

  const filteredTenants = tenants.filter((t) =>
    t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.listing?.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-deep-navy">Loading tenants...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep-navy md:text-3xl">All Tenants</h1>
          <p className="mt-1 text-ink/70">Manage contacts and lease agreements.</p>
        </div>
        <Link
          href="/landlord/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-90"
        >
          <UserPlus size={16} /> Add New Tenant
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by name, email, or property..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-ocean-blue/20 bg-white pl-10 pr-4 py-2.5 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
        />
      </div>

      {/* Tenant List */}
      {filteredTenants.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-ocean-blue/10">
          <UserPlus className="mx-auto h-12 w-12 text-ocean-blue/30 mb-3" />
          <h3 className="text-lg font-bold text-deep-navy mb-2">No tenants found</h3>
          <p className="text-ink/70 mb-6">Start by registering a new tenant for one of your properties.</p>
          <Link
            href="/landlord/tenants/new"
            className="text-ocean-blue font-semibold hover:underline"
          >
            Add Your First Tenant →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ocean-blue/10 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-mist-white border-b border-ocean-blue/10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-ink/70 uppercase">Tenant</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink/70 uppercase">Property / Unit</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink/70 uppercase">Rent</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink/70 uppercase">Lease Ends</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink/70 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-blue/10">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-mist-white/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-ocean-blue/10 flex items-center justify-center text-ocean-blue font-bold text-xs">
                        {tenant.user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-semibold text-deep-navy">{tenant.user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-ink/60">{tenant.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-deep-navy">{tenant.listing?.properties?.name || 'N/A'}</p>
                    <p className="text-xs text-ink/60">{tenant.listing?.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-deep-navy">KES {Number(tenant.monthly_rent).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink/70">
                    {new Date(tenant.lease_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tenant.status === 'active' 
                        ? 'bg-signal-green/10 text-signal-green' 
                        : tenant.status === 'overdue'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-ink/10 text-ink/60'
                    }`}>
                      {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}