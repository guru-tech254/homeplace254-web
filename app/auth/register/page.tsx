"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock, Phone, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // ✅ FIX: Explicitly allow string | null to prevent TS build errors
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // ✅ FIX: Properly await the SSR client promise before destructuring
      const { data, error: signUpError } = await supabaseAuth.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        alert("Registration successful! Please check your email to confirm your account.");
        router.push("/auth/login");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist-white p-4 md:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-ocean-blue/10 overflow-hidden">
        {/* Header Section */}
        <div className="bg-deep-navy p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-gold rounded-full flex items-center justify-center mb-4 shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-white/70 mt-2 text-sm">Join HomePlace254 to find your next home</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {/* ✅ Safe conditional rendering for nullable error state */}
          {error !== null && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="mt-0.5 text-red-500 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all text-deep-navy placeholder:text-ink/40"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all text-deep-navy placeholder:text-ink/40"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+254 7XX XXX XXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all text-deep-navy placeholder:text-ink/40"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all text-deep-navy placeholder:text-ink/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-deep-navy transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-ocean-blue/20 bg-mist-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all text-deep-navy placeholder:text-ink/40"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-gold text-white font-bold py-3.5 rounded-xl hover:brightness-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-gold/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register Now"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-ocean-blue/10 text-center">
            <p className="text-sm text-ink/70">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-ocean-blue font-bold hover:text-deep-navy transition-colors underline-offset-4 hover:underline">
                Sign In Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}