import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/prompts',
        destination: '/audits',
        permanent: true,
      },
      {
        source: '/content-studio',
        destination: '/consultant',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
