import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Add Supabase Storage domain here later when connecting real data
      // {
      //   protocol: "https",
      //   hostname: "*.supabase.co",
      //   pathname: "/storage/v1/object/public/**",
      // },
    ],
  },
};

export default nextConfig;