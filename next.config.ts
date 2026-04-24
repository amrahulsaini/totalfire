import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Removed redirect from / to /main to keep store at homepage
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
