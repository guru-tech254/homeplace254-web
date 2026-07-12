"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Home, 
  PlusCircle, 
  Plus, 
  Users, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  List // ✅ Added List icon for My Listings
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { useState } from "react";

// ✅ UPDATED NAVIGATION ARRAY
const navItems = [
  { name: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
  { name: "My Properties", href: "/landlord/properties", icon: Home },
  { name: "My Listings", href: "/landlord/listings", icon: List }, // ✅ NEW ITEM ADDED HERE
  { name: "Add New Property", href: "/landlord/properties/new", icon: PlusCircle },
  { name: "Add Listing", href: "/landlord/listings/new", icon: Plus },
  { name: "Tenants", href: "/landlord/tenants", icon: Users },
  { name: "Messages", href: "/landlord/messages", icon: MessageSquare },
];

export default function LandlordClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-mist-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-deep-navy p-2 text-white md:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-deep-navy transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-white/10 px-6">
            <Link href="/" className="text-xl font-bold text-white">
              HomePlace<span className="text-amber-gold">254</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-ocean-blue text-white shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}