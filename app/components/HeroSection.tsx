import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
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
            India&apos;s ultimate esports tournament platform. Join skill-based matches,
            compete against the best, and earn real money rewards.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row gap-4 mt-10">
            <Link href="/modes" className="fire-btn text-lg !py-4 !px-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Browse Tournaments
            </Link>
            <Link href="/about" className="outline-btn text-lg !py-4 !px-10">
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up stagger-5 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <div className="stat-item">
              <div className="stat-number fire-text">7+</div>
              <div className="stat-label">Game Modes</div>
            </div>
            <div className="stat-item">
              <div className="stat-number blue-text">₹15+</div>
              <div className="stat-label">Per Kill Rewards</div>
            </div>
            <div className="stat-item">
              <div className="stat-number fire-text">₹20</div>
              <div className="stat-label">Entry From</div>
            </div>
            <div className="stat-item">
              <div className="stat-number blue-text">100%</div>
              <div className="stat-label">Secure Payments</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
