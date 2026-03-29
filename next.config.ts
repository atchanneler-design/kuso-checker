import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/disclaimer',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
