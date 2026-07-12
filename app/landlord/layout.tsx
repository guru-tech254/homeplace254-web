"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Building2, List, Users, MessageSquare, 
  LogOut, Menu, X 
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/landlord/properties", label: "My Properties", icon: <Building2 size={20} /> },
  { href: "/landlord/listings", label: "My Listings", icon: <List size={20} /> },
  { href: "/landlord/tenants", label: "Tenants", icon: <Users size={20} /> },
  { href: "/landlord/messages", label: "Messages", icon: <MessageSquare size={20} /> },
];

export default function LandlordClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-mist-white flex flex-col md:flex-row">
      
      {/* ✅ MOBILE HEADER: Fixed top bar, separate from content */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-deep-navy text-white z-50 flex items-center justify-between px-4 shadow-md">
        <Link href="/" className="text-lg font-bold">
          HomePlace<span className="text-amber-gold">254</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* ✅ SIDEBAR: Hidden on mobile unless toggled */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-deep-navy text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:h-screen md:sticky md:top-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 border-b border-white/10 hidden md:block">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            HomePlace<span className="text-amber-gold">254</span>
          </Link>
          <p className="text-xs text-white/50 mt-1">Landlord Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto h-full pb-20">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-amber-gold text-white shadow-md" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-deep-navy">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ✅ MOBILE MENU BACKDROP */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ✅ MAIN CONTENT: Add top padding on mobile to clear the header */}
      <main className="flex-1 pt-20 md:pt-0 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}