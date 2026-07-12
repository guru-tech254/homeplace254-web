"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Building2, Users, TrendingUp, AlertCircle, ArrowRight, UserPlus, MapPin, Home, PlusCircle, Shield } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  occupancyRate: number;
  totalOverdue: number;
  monthlyIncome: number;
}

interface PropertySummary {
  id: string;
  name: string;
  estate: string;
  county: string;
  total_units: number;
}

export default function LandlordDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [userData, setUserData] = useState<{ kyc_status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    try {
      const { data: userData } = await supabaseAuth
        .from("users")
        .select("kyc_status")
        .eq("id", user.id)
        .single();

      const { data: propsData } = await supabaseAuth
        .from("properties")
        .select("id, name, estate, county, total_units")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

      const { data: tenantsData } = await supabaseAuth
        .from("tenants")
        .select("id, status, monthly_rent")
        .eq("landlord_id", user.id);

      if (propsData) setProperties(propsData);
      setUserData(userData);

      const totalUnits = propsData?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;
      const activeTenants = tenantsData?.filter(t => t.status === "active").length || 0;
      const overdueTenants = tenantsData?.filter(t => t.status === "overdue").length || 0;
      const monthlyIncome = tenantsData
        ?.filter(t => t.status === "active")
        .reduce((sum, t) => sum + Number(t.monthly_rent), 0) || 0;

      setStats({
        totalProperties: propsData?.length || 0,
        totalTenants: activeTenants,
        occupancyRate: totalUnits > 0 ? Math.round((activeTenants / totalUnits) * 100) : 0,
        totalOverdue: overdueTenants,
        monthlyIncome,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-deep-navy">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* ✅ MOBILE-OPTIMIZED HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-navy md:text-3xl">Landlord Dashboard</h1>
          <p className="mt-1 text-sm text-ink/70 md:text-base">Overview of your properties, tenants, and income.</p>
        </div>
        
        <Link
          href="/landlord/tenants/new"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-gold px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-90 hover:shadow-md active:scale-95"
        >
          <UserPlus size={18} />
          Add New Tenant
        </Link>
      </div>

      {/* ✅ RESPONSIVE STATS GRID: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Properties" 
          value={stats?.totalProperties || 0} 
          icon={<Building2 size={24} />} 
          color="bg-ocean-blue"
          link="/landlord/properties"
        />
        <StatCard 
          title="Active Tenants" 
          value={stats?.totalTenants || 0} 
          icon={<Users size={24} />} 
          color="bg-signal-green"
          link="/landlord/tenants"
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${stats?.occupancyRate || 0}%`} 
          icon={<TrendingUp size={24} />} 
          color="bg-amber-gold"
          link="/landlord/properties"
        />
        <StatCard 
          title="Overdue Payments" 
          value={stats?.totalOverdue || 0} 
          icon={<AlertCircle size={24} />} 
          color="bg-red-500"
          link="/landlord/payments"
        />
      </div>

      {/* Monthly Income Banner */}
      <div className="rounded-xl bg-gradient-to-r from-deep-navy to-ocean-blue p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">Projected Monthly Income</p>
        <p className="mt-2 text-2xl font-bold md:text-3xl">KES {(stats?.monthlyIncome || 0).toLocaleString()}</p>
        <p className="mt-1 text-xs text-white/70 md:text-sm">From {stats?.totalTenants || 0} active tenants across {stats?.totalProperties || 0} properties</p>
      </div>

      {/* ✅ VERTICAL QUICK ACTIONS ON MOBILE */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link 
          href="/landlord/properties/new"
          className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md hover:border-ocean-blue/30 active:scale-[0.98]"
        >
          <div className="shrink-0 rounded-lg bg-deep-navy p-3 text-white">
            <PlusCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-deep-navy">Add New Property</h3>
            <p className="text-sm text-ink/70">Register a building or complex</p>
          </div>
        </Link>

        <Link 
          href="/landlord/listings/new"
          className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md hover:border-ocean-blue/30 active:scale-[0.98]"
        >
          <div className="shrink-0 rounded-lg bg-amber-gold p-3 text-white">
            <Home size={24} />
          </div>
          <div>
            <h3 className="font-bold text-deep-navy">Add New Listing</h3>
            <p className="text-sm text-ink/70">Create a rental unit</p>
          </div>
        </Link>

        <VerificationStatusCard kycStatus={userData?.kyc_status || 'identity_pending'} />
      </div>

      {/* Properties Quick Access List */}
      <div>
        <h2 className="mb-2 text-lg font-bold text-deep-navy md:mb-4">Your Properties</h2>
        <p className="mb-4 text-sm text-ink/70">Click a property to manage tenants, view occupancy, and track income.</p>
        
        {properties.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center border border-ocean-blue/10">
            <Building2 className="mx-auto h-12 w-12 text-ocean-blue/30 mb-3" />
            <p className="text-ink/70 mb-4">You haven't added any properties yet.</p>
            <Link href="/landlord/properties/new" className="text-ocean-blue font-semibold hover:underline">
              Add Your First Property →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <Link 
                key={prop.id} 
                href={`/landlord/properties/${prop.id}`}
                className="group rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md hover:border-ocean-blue/30 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-deep-navy line-clamp-1">{prop.name}</h3>
                  <ArrowRight size={16} className="text-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </div>
                <div className="flex items-center gap-1 text-xs text-ink/60 mb-2">
                  <MapPin size={12} />
                  <span>{prop.estate}, {prop.county}</span>
                </div>
                <div className="text-xs font-semibold text-ocean-blue bg-mist-white inline-block px-2 py-1 rounded mt-2">
                  {prop.total_units} Unit{prop.total_units !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, link }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  link: string;
}) {
  return (
    <Link href={link} className="group rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/70">{title}</p>
          <p className="mt-2 text-2xl font-bold text-deep-navy">{value}</p>
        </div>
        <div className={`rounded-lg ${color} p-3 text-white shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity">
        View Details <ArrowRight size={12} />
      </div>
    </Link>
  );
}

function VerificationStatusCard({ kycStatus }: { kycStatus: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'fully_verified':
        return { bg: 'bg-signal-green', icon: <Shield size={24} />, title: 'Verified', desc: 'Account fully verified', color: 'text-signal-green' };
      case 'identity_pending':
        return { bg: 'bg-amber-gold', icon: <Shield size={24} />, title: 'Pending Review', desc: 'ID verification in progress', color: 'text-amber-gold' };
      case 'documents_pending':
        return { bg: 'bg-ocean-blue', icon: <Shield size={24} />, title: 'Documents Needed', desc: 'Upload required documents', color: 'text-ocean-blue' };
      case 'rejected':
        return { bg: 'bg-red-500', icon: <Shield size={24} />, title: 'Verification Failed', desc: 'Please contact support', color: 'text-red-500' };
      default:
        return { bg: 'bg-ink/30', icon: <Shield size={24} />, title: 'Unknown Status', desc: 'Contact support', color: 'text-ink/70' };
    }
  };

  const config = getStatusConfig(kycStatus);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-lg ${config.bg} p-3 text-white`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-deep-navy truncate">{config.title}</h3>
          <p className="text-sm text-ink/70 line-clamp-2">{config.desc}</p>
          {kycStatus !== 'fully_verified' && (
            <Link 
              href="/landlord/verification" 
              className={`mt-2 inline-block text-xs font-semibold ${config.color} hover:underline`}
            >
              Complete Verification →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}