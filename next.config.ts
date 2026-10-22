import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a dev server use its own build folder (NEXT_DIST_DIR=.next-dev) so it never clashes with `next build`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
