import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allModes } from "../../components/ModesShowcase";
import { modeDetails } from "../modeData";

const validSlugs = allModes.map((m) => m.slug);

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mode = allModes.find((m) => m.slug === slug);
  if (!mode) return { title: "Mode Not Found" };
  return {
    title: mode.title,
    description: `Join ${mode.title} tournament. Entry: ₹${mode.entryFee}. ${mode.players}. Compete and earn real money.`,
  };
}

export default async function ModeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mode = allModes.find((m) => m.slug === slug);
  const details = modeDetails[slug];

  if (!mode || !details) {
    notFound();
  }

  const badgeColor =
    mode.category === "br"
      ? "var(--accent-primary)"
      : mode.category === "cs"
      ? "var(--accent-blue)"
      : "var(--accent-purple)";

  const categoryLabel =
    mode.category === "br"
      ? "Battle Royale"
      : mode.category === "cs"
      ? "Clash Squad"
      : "Lone Wolf";

  return (
    <div className="page-enter pt-20 pb-20" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/modes"
          className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Modes
        </Link>

        {/* Hero Image */}
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <Image src={mode.image} alt={mode.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: `${badgeColor}cc`, color: "white" }}
            >
              {categoryLabel}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{mode.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-white">About This Mode</h2>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {details.fullDescription}
              </p>
            </div>

            {/* Rules */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Rules & Guidelines</h2>
              <ul className="space-y-3">
                {details.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: `${badgeColor}25`, color: badgeColor }}
                    >
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* In-App Screenshot */}
            {details.insideImage && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4 text-white">In-Game Preview</h2>
                <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden">
                  <Image src={details.insideImage} alt={`${mode.title} in-game`} fill className="object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Breakdown */}
            <div className="glass-card overflow-hidden">
              <div className="p-4" style={{ background: `${badgeColor}15`, borderBottom: "1px solid var(--border-color)" }}>
                <h3 className="font-bold text-white text-center">Reward Breakdown</h3>
              </div>
              <div>
                {details.rewardBreakdown.map((item) => (
                  <div key={item.label} className="prize-row">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <span className="text-sm font-bold text-right text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,212,255,0.15)" }}>
                  🔒
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Secured by Razorpay</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>100% safe transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,70,85,0.15)" }}>
                  ❌
                </div>
                <div>
                  <p className="text-sm font-bold text-white">No Refunds</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Entry fees are non-refundable</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,255,136,0.15)" }}>
                  🎯
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Skill-Based</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Earnings based on performance</p>
                </div>
              </div>
            </div>

            {/* Join CTA */}
            <div className="glass-card p-6 text-center animate-pulse-glow">
              <p className="text-2xl font-extrabold text-white mb-1">₹{mode.entryFee}</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>per player entry fee</p>
              <button className="fire-btn w-full justify-center text-lg !py-3">
                Join Tournament
              </button>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Entry fee is mandatory for all players
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
