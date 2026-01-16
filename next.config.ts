/** @type {import('next').NextConfig} */
const nextConfig = {
  // removed: Next.js 16 no longer supports `eslint` in next.config.ts


  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      { source: "/preise", destination: "/pricing", permanent: true },
      { source: "/preise/", destination: "/pricing", permanent: true },
      { source: "/terms", destination: "/agb", permanent: true },
      { source: "/privacy", destination: "/datenschutz", permanent: true },
      { source: "/legal", destination: "/agb", permanent: false },
      { source: "/agb-old", destination: "/agb", permanent: true },
    ];
  },
};

module.exports = nextConfig;
