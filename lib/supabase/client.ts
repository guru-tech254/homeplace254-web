import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Force a console log so we can see what the browser is receiving
  console.log("🔍 SUPABASE CLIENT DEBUG:");
  console.log("URL:", url);
  console.log("KEY exists?", !!key);

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables in client!");
  }

  return createBrowserClient(url, key)
}