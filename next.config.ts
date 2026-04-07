import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/main/about",
        permanent: false,
      },
      {
        source: "/contact",
        destination: "/main/contact",
        permanent: false,
      },
      {
        source: "/faq",
        destination: "/main/faq",
        permanent: false,
      },
      {
        source: "/modes/:path*",
        destination: "/main/modes/:path*",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
