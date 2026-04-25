import type { Metadata } from "next";
import Image from "next/image";
import { Target, Lock, Scale, Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about TotalFire — India's premier esports tournament platform. Our mission, values, and commitment to fair competitive gaming.",
};

export default function AboutPage() {
  return (
    <div className="page-enter pt-24 pb-20" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="section-heading">
            About <span className="fire-text">TotalFire</span>
          </h1>
          <p className="section-subheading">
            We&apos;re building India&apos;s most trusted esports tournament platform where skill meets opportunity.
          </p>
        </div>

        {/* Logo + Mission */}
        <div className="glass-card p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <Image
              src="/totalfire-logo.webp"
              alt="TotalFire Logo"
              width={140}
              height={140}
              className="rounded-2xl animate-float"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Our Mission</h2>
            <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              TotalFire was created with a single vision — to provide a professional, fair, and exciting
              esports tournament platform for gamers across India. We believe in rewarding skill and
              providing a safe, secure environment where competitive gaming thrives.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[
            {
              icon: <Target size={28} />,
              title: "Skill-Based Competition",
              desc: "We don't believe in luck. Our platform rewards pure skill. Every rupee you earn is a testament to your gameplay ability.",
            },
            {
              icon: <Lock size={28} />,
              title: "Secure & Transparent",
              desc: "All payments are processed through Cashfree, ensuring complete security. Our earnings model is transparent — what you see is what you get.",
            },
            {
              icon: <Scale size={28} />,
              title: "Fair Play",
              desc: "Zero tolerance for cheating. We have strict anti-cheat measures and admin verification to ensure every match is played on equal ground.",
            },
            {
              icon: <Rocket size={28} />,
              title: "Growing Community",
              desc: "We're more than a platform — we're a community of passionate gamers. Join thousands who compete, connect, and celebrate the spirit of esports.",
            },
          ].map((v) => (
            <div key={v.title} className="glass-card p-6">
              <div className="mb-3" style={{ color: "var(--accent-primary)" }}>{v.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* What We Offer */}
        <div className="glass-card p-8 md:p-12 mb-10">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: "var(--text-primary)" }}>What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: "7+", label: "Game Modes" },
              { num: "₹15-₹45", label: "Reward Range" },
              { num: "₹20", label: "Lowest Entry" },
              { num: "24/7", label: "Tournaments" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold fire-text mb-1">{s.num}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Have Questions?</h2>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
            Reach out to us at{" "}
            <a href="mailto:team@totalfire.in" className="font-bold" style={{ color: "var(--accent-primary)" }}>
              team@totalfire.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
