"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { DollarSign, Wrench, FileText, Home, Calendar, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

interface TenantDashboardData {
  tenant: {
    id: string;
    monthly_rent: number;
    status: string;
    lease_end: string;
  };
  listing: {
    title: string;
    property: {
      name: string;
      address: string;
    };
  };
  nextPaymentDue: string;
  totalPaid: number;
}

export default function TenantDashboardPage() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    // Fetch tenant record for current user
    const { data: tenantData } = await supabaseAuth
      .from("tenants")
      .select(`
        id,
        monthly_rent,
        status,
        lease_end,
        listing:listing_id (
          title,
          property:property_id (
            name,
            address
          )
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (!tenantData) {
      setLoading(false);
      return;
    }

    // Calculate next payment due date (1st of next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Mock total paid (replace with actual payments query later)
    const totalPaid = 0;

    setData({
      tenant: tenantData,
      listing: tenantData.listing as any,
      nextPaymentDue: nextMonth.toLocaleDateString("en-KE", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      totalPaid,
    });

    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-deep-navy">Loading your dashboard...</div>;
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-ocean-blue/10">
        <Home className="mx-auto h-16 w-16 text-ocean-blue/30 mb-4" />
        <h2 className="text-xl font-bold text-deep-navy mb-2">No Active Lease Found</h2>
        <p className="text-ink/70 mb-6">You don't have an active tenancy registered yet.</p>
        <p className="text-sm text-ink/60">Contact your landlord to be added to a property.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-navy md:text-3xl">Welcome Home</h1>
        <p className="mt-1 text-ink/70">{data.listing.property.name} • {data.listing.title}</p>
      </div>

      {/* Key Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Monthly Rent"
          value={`KES ${Number(data.tenant.monthly_rent).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="bg-ocean-blue"
        />
        <InfoCard
          title="Next Payment Due"
          value={data.nextPaymentDue}
          icon={<Calendar size={24} />}
          color="bg-amber-gold"
        />
        <InfoCard
          title="Lease Ends"
          value={new Date(data.tenant.lease_end).toLocaleDateString("en-KE", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
          icon={<FileText size={24} />}
          color="bg-deep-navy"
        />
        <InfoCard
          title="Status"
          value={data.tenant.status.charAt(0).toUpperCase() + data.tenant.status.slice(1)}
          icon={<AlertCircle size={24} />}
          color={data.tenant.status === "active" ? "bg-signal-green" : "bg-red-500"}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-deep-navy">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Pay Rent"
            description="Make your monthly rent payment via M-Pesa"
            icon={<DollarSign size={24} />}
            href="/tenant/payments"
            color="bg-signal-green"
          />
          <ActionCard
            title="Report Issue"
            description="Submit a maintenance request"
            icon={<Wrench size={24} />}
            href="/tenant/maintenance/new"
            color="bg-ocean-blue"
          />
          <ActionCard
            title="Lease Agreement"
            description="View and download your lease"
            icon={<Download size={24} />}
            href="/tenant/lease"
            color="bg-deep-navy"
          />
        </div>
      </div>

      {/* Property Details */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10">
        <h2 className="text-lg font-bold text-deep-navy mb-4">Your Home</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-ink/60 mb-1">Property Name</p>
            <p className="font-semibold text-deep-navy">{data.listing.property.name}</p>
          </div>
          <div>
            <p className="text-sm text-ink/60 mb-1">Unit</p>
            <p className="font-semibold text-deep-navy">{data.listing.title}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-ink/60 mb-1">Address</p>
            <p className="text-deep-navy">{data.listing.property.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-ocean-blue/10">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${color} p-2.5 text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-ink/70">{title}</p>
          <p className="text-lg font-bold text-deep-navy">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon, href, color }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  href: string;
  color: string;
}) {
  return (
    <Link 
      href={href}
      className="group rounded-xl bg-white p-6 shadow-sm border border-ocean-blue/10 transition-all hover:shadow-md hover:border-ocean-blue/30"
    >
      <div className={`rounded-lg ${color} p-3 text-white w-fit mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-deep-navy mb-1">{title}</h3>
      <p className="text-sm text-ink/70">{description}</p>
    </Link>
  );
}