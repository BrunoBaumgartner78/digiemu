/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional: if EPERM persists, reducing FS cache churn can help
  // (Keep this ON only if needed; remove if everything is stable)
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
