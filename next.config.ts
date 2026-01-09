/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      { pathname: "/api/media/thumbnail/**", search: "**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
    ],
  },
  // Security headers are applied via middleware (`src/middleware.ts`) to keep logic centralized.
};

module.exports = nextConfig;
