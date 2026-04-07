import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppChrome from "./components/AppChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const storeDisplay = Bebas_Neue({
  variable: "--font-store-display",
  subsets: ["latin"],
  weight: "400",
});

const storeBody = Space_Grotesk({
  variable: "--font-store-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TotalFire Store",
    template: "%s | TotalFire",
  },
  description:
    "TotalFire.in ecommerce storefront for gaming gear, merch, and digital products. Tournament portal available at /main.",
  icons: {
    icon: "/totalfire-icon.ico",
    shortcut: "/totalfire-icon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${storeDisplay.variable} ${storeBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
