import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.UNDANGAN_NEXT_DIST_DIR || ".next",
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
