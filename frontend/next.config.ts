import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tránh Next.js nhầm root monorepo (package-lock.json ở thư mục cha)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
