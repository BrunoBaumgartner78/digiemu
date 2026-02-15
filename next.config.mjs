// next.config.mjs
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
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },

  async redirects() {
    return [
      // ✅ Auth legacy routes -> actual pages
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/login/", destination: "/login", permanent: true },
      { source: "/auth/register", destination: "/register", permanent: true },
      { source: "/auth/register/", destination: "/register", permanent: true },

      // existing redirects
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
