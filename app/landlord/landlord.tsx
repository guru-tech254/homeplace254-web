import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandlordClientLayout from "./LandlordClientLayout";

export default async function LandlordRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, send to login page
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is verified in public table
  const { data: profile } = await supabase
    .from("users")
    .select("kyc_status")
    .eq("id", user.id)
    .single();

  // If not verified, send to pending page
  if (profile?.kyc_status !== "fully_verified") {
    redirect("/landlord/pending");
  }

  // If verified, render the client layout with sidebar
  return <LandlordClientLayout>{children}</LandlordClientLayout>;
}