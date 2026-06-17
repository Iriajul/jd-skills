import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a slim production Docker image.
  output: "standalone",
  // Allow images from external sources if needed later
  images: { unoptimized: true },
};

export default nextConfig;
