"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("Login failed. No user returned.");

      const user = data.user;

      const { data: profile, error: profileError } = await supabaseAuth
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || user.user_metadata?.role || "landlord";

      if (role === "landlord" || role === "agent") {
        router.push("/landlord/dashboard");
      } else {
        router.push("/tenant/dashboard");
      }

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login. Please check your credentials.");
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
          <p className="text-ink/60 text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">
              Email or Phone
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-5 w-5" />
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-mist-white border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/10 transition-all"
                placeholder="you@example.com or 07XX XXX XXX"
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
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-mist-white border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/10 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-navy text-white py-3.5 rounded-lg font-semibold hover:bg-ocean-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* ✅ THE FIX: Notice the leading slash in href="/auth/register" */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-ink/60">
            Landlord or Agent?{" "}
            <Link href="/auth/register" className="text-ocean-blue font-semibold hover:underline">
              Create an account
            </Link>
          </p>
          <p className="text-sm text-ink/60">
            Tenant? Contact your landlord for credentials.
          </p>
        </div>
      </div>
    </div>
  );
}