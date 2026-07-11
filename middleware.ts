import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protect landlord routes
  if (request.nextUrl.pathname.startsWith("/landlord")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    
    const role = session.user.user_metadata?.role;
    if (role !== "landlord" && role !== "agent") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect tenant portal routes
  if (request.nextUrl.pathname.startsWith("/tenant")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/landlord/:path*", "/tenant/:path*"],
};