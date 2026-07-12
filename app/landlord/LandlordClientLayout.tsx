"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  MessageSquare, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Building2,
  List // ✅ Added icon for listings
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/landlord/properties", label: "Properties", icon: <Building2 size={20} /> },
  { href: "/landlord/listings", label: "My Listings", icon: <List size={20} /> }, // ✅ NEW LINK ADDED HERE
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
    <div className="min-h-screen bg-mist-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-deep-navy text-white fixed h-full z-30">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            HomePlace<span className="text-amber-gold">254</span>
          </Link>
          <p className="text-xs text-white/50 mt-1">Landlord Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-deep-navy text-white z-40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">HomePlace<span className="text-amber-gold">254</span></Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-deep-navy z-30 p-4 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-lg ${
                  isActive ? "bg-amber-gold text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {item.icon}
                <span className="font-medium text-lg">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-4 w-full rounded-lg text-red-400 hover:bg-red-500/20 mt-8"
          >
            <LogOut size={20} />
            <span className="font-medium text-lg">Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}