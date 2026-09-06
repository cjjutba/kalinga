import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets a page call forbidden() and render the segment's forbidden.tsx with a 403.
    authInterrupts: true,
  },
};

export default nextConfig;
