// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Neue, empfohlene Schreibweise statt `domains`
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/**",
      },
    ],
  },
  experimental: {
    // deine Flags hier, falls du welche brauchst
  },
};

export default nextConfig;
