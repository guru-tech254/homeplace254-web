"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isEmail = identifier.includes("@");
      const loginData = isEmail 
        ? { email: identifier, password }
        : { phone: identifier.startsWith("+") ? identifier : `+254${identifier}`, password };

      const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword(loginData);

      if (signInError) throw signInError;

      const role = data.user?.user_metadata?.role || "tenant";
      router.push(role === "landlord" || role === "agent" ? "/landlord/dashboard" : "/tenant/portal");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials.");
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
          <p className="mt-2 text-sm text-ink/70">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Email or Phone</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input type="text" placeholder="you@example.com or 07XX XXX XXX" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-deep-navy">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-navy/50" />
              <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-ocean-blue/20 bg-mist-white py-3 pl-10 pr-4 text-sm text-ink focus:border-ocean-blue focus:outline-none focus:ring-1 focus:ring-ocean-blue" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-deep-navy py-3.5 text-base font-bold text-white transition-all hover:bg-ocean-blue disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-ink/60">
          <p>Landlord or Agent? <Link href="/auth/register" className="font-semibold text-ocean-blue hover:text-deep-navy">Create an account</Link></p>
          <p className="mt-2">Tenant? Contact your landlord for credentials.</p>
        </div>
      </div>
    </div>
  );
}