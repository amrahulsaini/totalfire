"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="nav-glass fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/totalfire-logo.webp"
              alt="TotalFire"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold fire-text">TotalFire</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/modes" className="nav-link">Modes</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
            <Link href="/faq" className="nav-link">FAQ</Link>
            <Link href="/modes" className="fire-btn text-sm !py-2 !px-5">
              Join Tournament
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link href="/" className="nav-link py-2" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/modes" className="nav-link py-2" onClick={() => setMobileOpen(false)}>Modes</Link>
              <Link href="/about" className="nav-link py-2" onClick={() => setMobileOpen(false)}>About</Link>
              <Link href="/contact" className="nav-link py-2" onClick={() => setMobileOpen(false)}>Contact</Link>
              <Link href="/faq" className="nav-link py-2" onClick={() => setMobileOpen(false)}>FAQ</Link>
              <Link href="/modes" className="fire-btn text-sm text-center !py-2 mt-2" onClick={() => setMobileOpen(false)}>
                Join Tournament
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
