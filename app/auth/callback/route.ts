import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // ✅ CRITICAL FIX: Await the promise so we get the actual Supabase client instance
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const user = data.user;
      
      // Check metadata for role (fallback to landlord if not set)
      const role = user.user_metadata?.role || "landlord";

      // Route based on role
      const redirectUrl = role === "landlord" 
        ? `${origin}/landlord/dashboard` 
        : `${origin}/tenant/dashboard`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback redirect if no code or exchange failed
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}