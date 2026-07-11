import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/chat-context";
import GlobalChatWidget from "@/components/GlobalChatWidget";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HomePlace254 | Your Link to Your Next Home",
  description: "Find verified rentals and properties for sale in Kenya. Secure payments, digital leases, and direct landlord chat.",
  keywords: ["rentals kenya", "houses for sale nairobi", "homeplace254", "property management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-mist-white text-deep-navy">
        <ChatProvider>
          {/* Main App Content */}
          {children}
          
          {/* Global Chat Widget - Only renders when triggered via context */}
          <GlobalChatWidget />
        </ChatProvider>
      </body>
    </html>
  );
}