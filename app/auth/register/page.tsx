"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Mail, Lock, UserPlus, Loader2, Eye, EyeOff, Building2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabaseAuth.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { role: "landlord" },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Registration failed.");

      const user = data.user;

      const { error: profileError } = await supabaseAuth.from("profiles").upsert({
        id: user.id,
        email: user.email,
        role: "landlord",
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        console.warn("Profile creation warning:", profileError);
      }

      router.push("/landlord/dashboard");

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mist-white to-ocean-blue/5 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-ocean-blue/10 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            HomePlace<span className="text-amber-gold">254</span>
          </h1>
          <p className="text-ink/60 text-sm">Create your Landlord account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="bg-amber-gold/10 border border-amber-gold/20 rounded-lg p-3 flex items-center gap-3">
            <Building2 className="text-amber-gold shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-deep-navy">Landlord Account</p>
              <p className="text-xs text-ink/60">Manage properties and tenants</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-mist-white border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/10 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-mist-white border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/10 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-deep-navy"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-navy text-white py-3.5 rounded-lg font-semibold hover:bg-ocean-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? "Creating Account..." : "Create Landlord Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-ink/60">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-ocean-blue font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}