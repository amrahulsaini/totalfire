import Image from "next/image";
import Link from "next/link";

interface ModeCardProps {
  title: string;
  slug: string;
  image: string;
  category: "br" | "cs" | "lw";
  players: string;
  entryFee: number;
  perKill?: number;
  winPrize?: string;
  prizePool?: number;
}

export default function ModeCard({
  title,
  slug,
  image,
  category,
  players,
  entryFee,
  perKill,
  winPrize,
  prizePool,
}: ModeCardProps) {
  const badgeClass = category === "br" ? "badge-br" : category === "cs" ? "badge-cs" : "badge-lw";
  const categoryLabel = category === "br" ? "Battle Royale" : category === "cs" ? "Clash Squad" : "Lone Wolf";

  return (
    <Link href={`/modes/${slug}`} className="block">
      <div className="mode-card">
        <div className="mode-card-image">
          <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          <span className={`mode-badge ${badgeClass}`}>{categoryLabel}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <h3 className="text-lg font-bold text-white drop-shadow-lg">{title}</h3>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{players}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>₹{entryFee}/player</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {perKill && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(230,57,70,0.1)", color: "var(--accent-primary)" }}>
                ₹{perKill}/Kill
              </span>
            )}
            {winPrize && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(42,157,143,0.1)", color: "var(--accent-green)" }}>
                Win: {winPrize}
              </span>
            )}
            {prizePool && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(108,71,160,0.1)", color: "var(--accent-purple)" }}>
                Pool: ₹{prizePool}
              </span>
            )}
          </div>
          <div className="pt-2">
            <span className="fire-btn w-full text-center text-sm !py-2.5 justify-center">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
