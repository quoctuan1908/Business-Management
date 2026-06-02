import type { NextConfig } from "next";
import path from "path";

<<<<<<< HEAD
const nextConfig: NextConfig = {
  // Tránh Next.js nhầm root monorepo (package-lock.json ở thư mục cha)
  turbopack: {
    root: path.resolve(__dirname),
  },
};
=======
const nextConfig: NextConfig = {};
>>>>>>> feature/activities

export default nextConfig;
