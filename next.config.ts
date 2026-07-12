import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ FIX: Explicitly define project root to prevent Turbopack lockfile confusion
  turbopack: {
    root: "./",
  },

  // ✅ Required for external property images and Google Maps assets
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Optional: Silence telemetry warning during build
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;