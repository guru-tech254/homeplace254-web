import { createClient } from "@/lib/supabase/server"; // Adjust path to your server client
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // If a 'next' parameter is passed, use it, otherwise default to login
  const next = searchParams.get("next") ?? "/auth/login";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const user = data.user;
      
      // Check metadata for role
      const role = user.user_metadata?.role || "tenant";

      // ✅ Route based on role
      const redirectUrl = role === "landlord" 
        ? `${origin}/landlord/dashboard` 
        : `${origin}/tenant/dashboard`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback if code is invalid
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}