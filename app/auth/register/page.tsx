"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { User, Mail, Phone, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "landlord" as "landlord" | "agent",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = supabaseAuth;
      
      const { error: signUpError } = supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Show success message and redirect to login
      alert("Registration successful! Please check your email to confirm your account before logging in.");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-ocean-blue/10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-deep-navy">
            HomePlace<span className="text-amber-gold">254</span>
          </h1>
          <p className="mt-2 text-sm text-ink/70">Landlord / Agent Registration</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "landlord" })}
                className={`rounded-lg border p-3 text-sm font-semibold transition-all ${
                  formData.role === "landlord"
                    ? "border-ocean-blue bg-ocean-blue/10 text-ocean-blue"
                    : "border-ocean-blue/20 bg-mist-white text-ink hover:border-ocean-blue/40"
                }`}
              >
                Landlord
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "agent" })}
                className={`rounded-lg border p-3 text-sm font-semibold transition-all ${
                  formData.role === "agent"
                    ? "border-ocean-blue bg-ocean-blue/10 text-ocean-blue"
                    : "border-ocean-blue/20 bg-mist-white text-ink hover:border-ocean-blue/40"
                }`}
              >
                Agent
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input
                type="text"
                placeholder="John Kamau"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input
                type="tel"
                placeholder="07XX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-deep-navy py-3.5 text-base font-bold text-white transition-all hover:bg-ocean-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Register as Landlord/Agent"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-ocean-blue hover:text-deep-navy">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}