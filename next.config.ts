import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/articles",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/articles/:slug",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
