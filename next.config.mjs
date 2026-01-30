/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional: if EPERM persists, reducing FS cache churn can help
  // (Keep this ON only if needed; remove if everything is stable)
  webpack: (config) => {
    config.cache = false;
    return config;
  },
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
      {
        protocol: "https",
        hostname: "**.appspot.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
