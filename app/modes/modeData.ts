import { allModes } from "../components/ModesShowcase";

// Full details for each mode
const modeDetails: Record<string, {
  fullDescription: string;
  rules: string[];
  rewardBreakdown: { label: string; value: string }[];
  insideImage?: string;
}> = {
  "br-ranked": {
    fullDescription: "Battle Royale Ranked Solo mode — the ultimate survival challenge. 48 solo players drop into the battlefield. Every kill earns you ₹20. Survive, eliminate, and dominate to maximize your rewards. This is pure skill-based gameplay where your individual ability determines your earnings.",
    rules: [
      "48 solo players per match",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "Per kill reward: ₹20",
      "All players must join on time or forfeit their entry",
      "Use of hacks/cheats results in permanent ban",
      "Teaming up with other solo players is strictly prohibited",
      "Results are final and verified by admins",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "₹20" },
      { label: "Prize Pool", value: "₹400" },
      { label: "Total Players", value: "48 (Solo)" },
    ],
  },
  "br-duo": {
    fullDescription: "Battle Royale Duo mode — team up with your partner and take on 23 other duos. 48 players total (2×24 teams). Earn ₹20 per kill and fight for survival. Coordinate with your duo partner and play strategically to maximize kills and earnings.",
    rules: [
      "24 duo teams (48 players total)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "Per kill reward: ₹20",
      "Both team members must pay entry fee",
      "No teaming with other duos allowed",
      "Use of hacks/cheats results in permanent ban for both members",
      "Results verified by admin team",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "₹20" },
      { label: "Prize Pool", value: "₹500" },
      { label: "Total Players", value: "48 (2×24 Duos)" },
    ],
  },
  "br-squad": {
    fullDescription: "Battle Royale Squad mode — assemble your 4-man squad and drop into battle against 11 other squads. 48 players total (4×12 teams). Earn ₹15 per kill. Teamwork, communication, and strategy are key to dominating the competition.",
    rules: [
      "12 squads of 4 players (48 players total)",
      "Entry fee: ₹20 per player (mandatory, non-refundable)",
      "Per kill reward: ₹15",
      "All 4 squad members must pay entry fee",
      "No teaming with other squads",
      "Hacks/cheats = permanent ban for entire squad",
      "Admin decisions on results are final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹20 per player" },
      { label: "Per Kill Reward", value: "₹15" },
      { label: "Prize Pool", value: "₹500" },
      { label: "Total Players", value: "48 (4×12 Squads)" },
    ],
    insideImage: "/modes-images/app-inside/br-squad.jpeg",
  },
  "cs-1v1": {
    fullDescription: "Clash Squad 1v1 — the ultimate showdown. Two players face off head-to-head. No per-kill rewards here; the winner takes home ₹40. Pure 1-on-1 skill decides the match. Show your individual dominance.",
    rules: [
      "2 players face off (1v1)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "No per-kill rewards",
      "Winner receives ₹40",
      "Both players must join on time",
      "Hacks/cheats = permanent ban and forfeiture",
      "Admin verification of results is final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "None" },
      { label: "Winner Prize", value: "₹40" },
      { label: "Total Players", value: "2" },
    ],
  },
  "cs-2v2": {
    fullDescription: "Clash Squad 2v2 — team up with a partner and battle another duo. 4 players total. The winning team's each member receives ₹40. Team coordination and quick reflexes are the keys to victory in this intense format.",
    rules: [
      "2 teams of 2 players (4 total)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "No per-kill rewards",
      "Winning team: each member gets ₹40",
      "Both members of each team must pay entry",
      "Hacks/cheats = permanent ban",
      "Admin decisions are final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "None" },
      { label: "Winner Prize", value: "₹40 per member" },
      { label: "Total Players", value: "4 (2×2)" },
    ],
    insideImage: "/modes-images/app-inside/cs2vs2.jpeg",
  },
  "cs-4v4": {
    fullDescription: "Clash Squad 4v4 — the full-scale team battle. 8 players in two squads of 4. The winning team's each member receives ₹45 (total ₹180 for the winning team). This is where team strategy, callouts, and synergy make all the difference.",
    rules: [
      "2 teams of 4 players (8 total)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "No per-kill rewards",
      "Winning team: each member gets ₹45 (₹180 total)",
      "All 4 members must pay entry fee",
      "Hacks/cheats = permanent ban for entire team",
      "Admin verification of results is final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "None" },
      { label: "Winner Prize", value: "₹45 per member (₹180 total)" },
      { label: "Total Players", value: "8 (4×4)" },
    ],
  },
  "lw-1v1": {
    fullDescription: "Lone Wolf 1v1 — the most intense face-off. Two players battle it out in Lone Wolf mode. Winner takes ₹40. No teammates, no backup — just you and your opponent. Prove you're the best.",
    rules: [
      "2 players face off (1v1)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "No per-kill rewards",
      "Winner receives ₹40",
      "Both players must join on time",
      "Hacks/cheats = permanent ban",
      "Admin decisions on results are final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "None" },
      { label: "Winner Prize", value: "₹40" },
      { label: "Total Players", value: "2" },
    ],
    insideImage: "/modes-images/app-inside/lw1vs1.jpeg",
  },
  "lw-2v2": {
    fullDescription: "Lone Wolf 2v2 — partner up for this Lone Wolf team showdown. 4 players in two teams of 2. The winning team's each member receives ₹40 (total ₹80 for the winning team). Coordination in the tight Lone Wolf arena is crucial.",
    rules: [
      "2 teams of 2 players (4 total)",
      "Entry fee: ₹25 per player (mandatory, non-refundable)",
      "No per-kill rewards",
      "Winning team: each member gets ₹40 (₹80 total)",
      "Both members must pay entry fee",
      "Hacks/cheats = permanent ban",
      "Admin decisions are final",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill Reward", value: "None" },
      { label: "Winner Prize", value: "₹40 per member (₹80 total)" },
      { label: "Total Players", value: "4 (2×2)" },
    ],
    insideImage: "/modes-images/app-inside/lw2vs2.jpeg",
  },
};

export { modeDetails, allModes };
