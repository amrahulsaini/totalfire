"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/support", label: "Support" },
  { href: "/policies", label: "Policies" },
];

export default function StoreShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
                TF
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <strong className="text-gray-900 text-lg">TotalFire Store</strong>
                <em className="text-xs text-gray-500 not-italic">Premium Esports Commerce</em>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-orange-500 text-sm font-semibold transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/cart"
                className="text-gray-600 hover:text-orange-500 font-semibold px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition-colors"
              >
                Cart
              </Link>
              <Link
                href="/checkout"
                className="bg-green-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Checkout
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-orange-500 focus:outline-none p-2"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:text-orange-500 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/cart"
                  className="block text-center w-full bg-gray-100 text-gray-800 font-semibold px-4 py-3 rounded-lg border border-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cart
                </Link>
                <Link
                  href="/checkout"
                  className="block text-center w-full bg-green-600 text-white font-bold px-4 py-3 rounded-lg shadow-md hover:bg-green-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full bg-white">
        {children}
      </main>

      <footer className="bg-gray-50 text-gray-600 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <section className="space-y-4">
            <h3 className="text-gray-900 font-bold text-lg">TotalFire.in Commerce</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              High-performance gaming gear, creator essentials, and tournament digital products.
              Every checkout uses secure payment processing with clear policy visibility.
            </p>
          </section>

          <section className="space-y-4">
            <h4 className="text-gray-900 font-bold text-lg">Storefront</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-orange-500 transition-colors text-gray-600">All Products</Link></li>
              <li><Link href="/dashboard" className="hover:text-orange-500 transition-colors text-gray-600">Order Dashboard</Link></li>
              <li><Link href="/support" className="hover:text-orange-500 transition-colors text-gray-600">Support Desk</Link></li>
              <li><Link href="/checkout" className="hover:text-orange-500 transition-colors text-gray-600">Secure Checkout</Link></li>
            </ul>
          </section>

          <section className="space-y-4">
            <h4 className="text-gray-900 font-bold text-lg">Legal & Policy</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/policies/privacy" className="hover:text-orange-500 transition-colors text-gray-600">Privacy Policy</Link></li>
              <li><Link href="/policies/terms" className="hover:text-orange-500 transition-colors text-gray-600">Terms of Use</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-orange-500 transition-colors text-gray-600">Shipping Policy</Link></li>
              <li><Link href="/policies/refund" className="hover:text-orange-500 transition-colors text-gray-600">Refund Policy</Link></li>
            </ul>
          </section>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-12 pt-8 border-t border-gray-200 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} TotalFire.in. All rights reserved.</span>
          <div className="flex gap-6">
            <span>Secure Payments via Cashfree</span>
            <span>GST-ready invoicing enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}