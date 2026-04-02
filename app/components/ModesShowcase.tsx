import ModeCard from "./ModeCard";

export const allModes = [
  {
    title: "BR Ranked — Solo",
    slug: "br-ranked",
    image: "/modes-images/br-allmodes.jpeg",
    category: "br" as const,
    players: "48 Players (Solo)",
    entryFee: 25,
    perKill: 20,
    prizePool: 400,
  },
  {
    title: "BR — Duo",
    slug: "br-duo",
    image: "/modes-images/br-allmodes.jpeg",
    category: "br" as const,
    players: "48 Players (2×24)",
    entryFee: 25,
    perKill: 20,
    prizePool: 500,
  },
  {
    title: "BR — Squad",
    slug: "br-squad",
    image: "/modes-images/br-allmodes.jpeg",
    category: "br" as const,
    players: "48 Players (4×12)",
    entryFee: 20,
    perKill: 15,
    prizePool: 500,
  },
  {
    title: "CS 1 vs 1",
    slug: "cs-1v1",
    image: "/modes-images/cs1vs1.jpeg",
    category: "cs" as const,
    players: "2 Players",
    entryFee: 25,
    winPrize: "₹40 to Winner",
  },
  {
    title: "CS 2 vs 2",
    slug: "cs-2v2",
    image: "/modes-images/cs2vs2.jpeg",
    category: "cs" as const,
    players: "4 Players (2×2)",
    entryFee: 25,
    winPrize: "₹40/member",
  },
  {
    title: "CS 4 vs 4",
    slug: "cs-4v4",
    image: "/modes-images/cs2vs2.jpeg",
    category: "cs" as const,
    players: "8 Players (4×4)",
    entryFee: 25,
    winPrize: "₹45/member (₹180)",
  },
  {
    title: "LW 1 vs 1",
    slug: "lw-1v1",
    image: "/modes-images/lw1vs1.jpeg",
    category: "lw" as const,
    players: "2 Players",
    entryFee: 25,
    winPrize: "₹40 to Winner",
  },
  {
    title: "LW 2 vs 2",
    slug: "lw-2v2",
    image: "/modes-images/lw2vs2.jpeg",
    category: "lw" as const,
    players: "4 Players (2×2)",
    entryFee: 25,
    winPrize: "₹40/member (₹80)",
  },
];

export default function ModesShowcase({ limit }: { limit?: number }) {
  const modes = limit ? allModes.slice(0, limit) : allModes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {modes.map((mode, i) => (
        <div key={mode.slug} className={`animate-fade-in-up stagger-${Math.min(i + 1, 7)}`}>
          <ModeCard {...mode} />
        </div>
      ))}
    </div>
  );
}
