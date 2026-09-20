import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Memory-optimized build: use webpack (less RAM than Turbopack for this env)
  turbopack: false,
  experimental: {
    // Reduce parallel threads during build to save RAM
    cpus: 1,
  },
};

export default nextConfig;