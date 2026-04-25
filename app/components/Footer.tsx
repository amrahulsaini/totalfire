"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const portalBase = pathname.startsWith("/game") ? "/game" : "";

  const portalHref = (path: string) => {
    if (!portalBase) {
      return path;
    }
    return path === "/" ? portalBase : `${portalBase}${path}`;
  };

  return (
    <footer className="footer-gradient mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/totalfire-logo.webp" alt="TotalFire" width={36} height={36} className="rounded-lg" />
              <span className="text-lg font-bold fire-text">TotalFire</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              India&apos;s premier esports tournament platform. Compete, Earn, Dominate.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Quick Links</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link href={portalHref("/")} className="hover:opacity-80 transition-opacity">Home</Link></li>
              <li><Link href={portalHref("/modes")} className="hover:opacity-80 transition-opacity">All Modes</Link></li>
              <li><Link href={portalHref("/about")} className="hover:opacity-80 transition-opacity">About Us</Link></li>
              <li><Link href={portalHref("/faq")} className="hover:opacity-80 transition-opacity">FAQ</Link></li>
            </ul>
          </div>

          {/* Game Modes */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Game Modes</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link href={portalHref("/modes/br-ranked")} className="hover:opacity-80 transition-opacity">BR Ranked</Link></li>
              <li><Link href={portalHref("/modes/br-duo")} className="hover:opacity-80 transition-opacity">BR Duo</Link></li>
              <li><Link href={portalHref("/modes/br-squad")} className="hover:opacity-80 transition-opacity">BR Squad</Link></li>
              <li><Link href={portalHref("/modes/cs-1v1")} className="hover:opacity-80 transition-opacity">CS 1v1</Link></li>
              <li><Link href={portalHref("/modes/lw-1v1")} className="hover:opacity-80 transition-opacity">LW 1v1</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Contact</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>
                <a href="mailto:team@totalfire.in" className="hover:opacity-80 transition-opacity flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  team@totalfire.in
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Payments secured by
              </p>
              <span className="font-bold text-sm" style={{ color: "var(--accent-blue)" }}>Cashfree</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border-color)" }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} TotalFire. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
              <span>Skill-Based Earnings</span>
              <span>•</span>
              <span>No Refunds</span>
              <span>•</span>
              <span>18+ Only</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
