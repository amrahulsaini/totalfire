import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Removed redirect from / to /game to keep store at homepage
      {
        source: "/about",
        destination: "/game/about",
        permanent: false,
      },
      {
        source: "/contact",
        destination: "/game/contact",
        permanent: false,
      },
      {
        source: "/faq",
        destination: "/game/faq",
        permanent: false,
      },
      {
        source: "/modes/:path*",
        destination: "/game/modes/:path*",
        permanent: false,
      },
      {
        source: "/shop/:path*",
        destination: "/backup-old-ecommerce/shop/:path*",
        permanent: false,
      },
      {
        source: "/cart",
        destination: "/backup-old-ecommerce/cart",
        permanent: false,
      },
      {
        source: "/checkout",
        destination: "/backup-old-ecommerce/checkout",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/backup-old-ecommerce/dashboard",
        permanent: false,
      },
      {
        source: "/support",
        destination: "/backup-old-ecommerce/support",
        permanent: false,
      },
      {
        source: "/policies/:path*",
        destination: "/backup-old-ecommerce/policies/:path*",
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
