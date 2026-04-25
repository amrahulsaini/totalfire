"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  basePath?: string;
}

interface AppStats {
  activeUsers: number;
  downloads: number;
  activeWindowDays: number;
}

const MIN_ACTIVE_USERS = 3000;
const MIN_DOWNLOADS = 10000;
const WEBSITE_APK_VERSION = "1.0.3";
const WEBSITE_APK_FILE_NAME = `totalfire-v${WEBSITE_APK_VERSION}.apk`;

export default function HeroSection({ basePath = "" }: HeroSectionProps) {
  const [stats, setStats] = useState<AppStats>({
    activeUsers: MIN_ACTIVE_USERS,
    downloads: MIN_DOWNLOADS,
    activeWindowDays: 30,
  });

  const portalHref = (path: string) => {
    if (!basePath) {
      return path;
    }
    return path === "/" ? basePath : `${basePath}${path}`;
  };

  const formatCount = (value: number) =>
    new Intl.NumberFormat("en-IN").format(Math.max(0, Math.trunc(value)));

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const response = await fetch("/api/public/app-stats", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load app stats");
        }

        const data = (await response.json()) as Partial<AppStats>;

        if (!cancelled) {
          setStats({
            activeUsers: Number(data.activeUsers ?? 0),
            downloads: Number(data.downloads ?? 0),
            activeWindowDays: Number(data.activeWindowDays ?? 30),
          });
        }
      } catch {
        if (!cancelled) {
          setStats((prev) => prev);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeUsersDisplay = `${formatCount(Math.max(stats.activeUsers, MIN_ACTIVE_USERS))}+`;
  const downloadsDisplay = `${formatCount(Math.max(stats.downloads, MIN_DOWNLOADS))}+`;

  return (
    <section className="hero-bg relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-[0.06] animate-float"
          style={{ background: "var(--accent-primary)", filter: "blur(100px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.04] animate-float"
          style={{ background: "var(--accent-blue)", filter: "blur(120px)", animationDelay: "1.5s" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="animate-fade-in-up stagger-1 mb-8">
            <Image
              src="/totalfire-logo.webp"
              alt="TotalFire"
              width={120}
              height={120}
              className="rounded-2xl animate-float"
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up stagger-2 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl">
            Compete. <span className="fire-text">Dominate.</span>
            <br />
            <span className="blue-text">Earn Rewards.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up stagger-3 mt-6 text-lg md:text-xl max-w-2xl"
            style={{ color: "var(--text-secondary)" }}>
            Download the latest TotalFire APK, join skill-based matches,
            and compete against the best players.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              href={`/downloads/${WEBSITE_APK_FILE_NAME}`}
              className="fire-btn text-lg !py-4 !px-10"
              download={WEBSITE_APK_FILE_NAME}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              {`Download APK v${WEBSITE_APK_VERSION}`}
            </Link>
            <Link href={portalHref("/modes")} className="outline-btn text-lg !py-4 !px-10">
              Browse Tournaments
            </Link>
          </div>
          <p className="animate-fade-in-up stagger-4 mt-4 text-sm"
            style={{ color: "var(--text-secondary)" }}>
            Official signed Android APK. Package: <strong>com.totalfire.totalfire</strong>. Version: <strong>{WEBSITE_APK_VERSION}</strong>.
          </p>

          {/* Stats */}
          <div className="animate-fade-in-up stagger-5 mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12">
            <div className="stat-item">
              <div className="stat-number fire-text">
                {activeUsersDisplay}
              </div>
              <div className="stat-label">Active Users</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                Last {stats.activeWindowDays} days
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-number blue-text">
                {downloadsDisplay}
              </div>
              <div className="stat-label">App Downloads</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                Total installs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
