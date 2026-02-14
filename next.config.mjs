/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  images: {
    remotePatterns: [
      // Firebase Storage (download URLs)
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },

      // Firebase / Google Cloud Storage direct bucket URLs
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },

      // Google user content (Avatare etc.)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },

      // Unsplash / Pexels
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },

      // Optional: falls du irgendwo appspot-bucket URLs hast
      {
        protocol: "https",
        hostname: "*.appspot.com",
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

export default nextConfig;
