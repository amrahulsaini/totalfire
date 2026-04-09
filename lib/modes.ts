export type ModeCategory = "br" | "cs" | "lw" | "hs";

export interface RewardBreakdownItem {
  label: string;
  value: string;
}

export interface ModeConfig {
  id: number;
  title: string;
  slug: string;
  image: string;
  appImage: string;
  category: ModeCategory;
  players: string;
  maxPlayers: number;
  teamSize: number;
  entryFee: number;
  perKill?: number;
  prizePool?: number;
  winPrize?: string;
  fullDescription: string;
  rules: string[];
  rewardBreakdown: RewardBreakdownItem[];
}

export const allModes: ModeConfig[] = [
  {
    id: 1,
    title: "BR Ranked — Solo",
    slug: "br-ranked",
    image: "/modes-images/br-allmodes.jpeg",
    appImage: "/modes-images/app-inside/br-solo.jpeg",
    category: "br",
    players: "48 Players (Solo)",
    maxPlayers: 48,
    teamSize: 1,
    entryFee: 25,
    perKill: 20,
    prizePool: 400,
    fullDescription:
      "Battle Royale Ranked Solo mode with 48 solo players. Every kill earns ₹20. The displayed prize pool is for tournament context, but the main payout logic is driven by kill rewards and admin-updated results.",
    rules: [
      "48 solo players per match",
      "Entry fee: ₹25 per player",
      "Per kill reward: ₹20",
      "Prize pool shown as ₹400",
      "Solo teaming is strictly prohibited",
      "All players must join before match start",
      "Admins verify final results and payouts",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "₹20" },
      { label: "Prize Pool", value: "₹400" },
      { label: "Slots", value: "48 solo slots" },
    ],
  },
  {
    id: 2,
    title: "BR — Duo",
    slug: "br-duo",
    image: "/modes-images/br-allmodes.jpeg",
    appImage: "/modes-images/app-inside/br-duo.jpeg",
    category: "br",
    players: "48 Players (2×24)",
    maxPlayers: 48,
    teamSize: 2,
    entryFee: 25,
    perKill: 20,
    prizePool: 500,
    fullDescription:
      "Battle Royale Duo mode with 24 teams and 48 total players. Every kill earns ₹20. The prize pool is displayed for visibility, while actual reward distribution is managed through kills and admin-entered results.",
    rules: [
      "24 duo teams, 48 players total",
      "Entry fee: ₹25 per player",
      "Per kill reward: ₹20",
      "Prize pool shown as ₹500",
      "Team coordination matters for slot assignment",
      "No cross-team collaboration allowed",
      "Admins control room details and result settlement",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "₹20" },
      { label: "Prize Pool", value: "₹500" },
      { label: "Teams", value: "24 duo teams" },
    ],
  },
  {
    id: 3,
    title: "BR — Squad",
    slug: "br-squad",
    image: "/modes-images/br-allmodes.jpeg",
    appImage: "/modes-images/app-inside/br-squad.jpeg",
    category: "br",
    players: "48 Players (4×12)",
    maxPlayers: 48,
    teamSize: 4,
    entryFee: 20,
    perKill: 15,
    prizePool: 500,
    fullDescription:
      "Battle Royale Squad mode with 12 squads and 48 total players. Every kill earns ₹15. Squad slots are grouped by team so admins and players can see the occupied positions clearly.",
    rules: [
      "12 squads, 4 players each",
      "Entry fee: ₹20 per player",
      "Per kill reward: ₹15",
      "Prize pool shown as ₹500",
      "Team slots fill in grouped order",
      "Full squads are shown in upcoming entries",
      "Admins finalize reward credits after the match",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹20 per player" },
      { label: "Per Kill", value: "₹15" },
      { label: "Prize Pool", value: "₹500" },
      { label: "Teams", value: "12 squad teams" },
    ],
  },
  {
    id: 4,
    title: "CS 1 vs 1",
    slug: "cs-1v1",
    image: "/modes-images/cs1vs1.jpeg",
    appImage: "/modes-images/app-inside/cs1vs1.webp",
    category: "cs",
    players: "2 Players",
    maxPlayers: 2,
    teamSize: 1,
    entryFee: 25,
    winPrize: "₹40 to Winner",
    fullDescription:
      "Clash Squad 1v1 is a direct head-to-head match. There is no kill reward. The winner receives ₹40 based on admin-updated result submission.",
    rules: [
      "2 players only",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winner receives ₹40",
      "Room details appear 5 minutes before start time",
      "Filled slot blocks any second registration",
      "Admins verify winners and settle the wallet credit",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40" },
      { label: "Slots", value: "2 players" },
    ],
  },
  {
    id: 5,
    title: "CS 2 vs 2",
    slug: "cs-2v2",
    image: "/modes-images/cs2vs2.jpeg",
    appImage: "/modes-images/app-inside/cs2vs2.jpeg",
    category: "cs",
    players: "4 Players (2×2)",
    maxPlayers: 4,
    teamSize: 2,
    entryFee: 25,
    winPrize: "₹40/member",
    fullDescription:
      "Clash Squad 2v2 with 2 teams of 2. There is no kill payout. Each member of the winning team receives ₹40 through the admin result flow.",
    rules: [
      "2 teams, 2 players each",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winning team members receive ₹40 each",
      "Teams are grouped visibly in slot order",
      "Filled matches are marked unavailable",
      "Admins push final wallet rewards after result entry",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40 per member" },
      { label: "Teams", value: "2 teams of 2" },
    ],
  },
  {
    id: 6,
    title: "CS 4 vs 4",
    slug: "cs-4v4",
    image: "/modes-images/cs2vs2.jpeg",
    appImage: "/modes-images/app-inside/cs4vs4.jpeg",
    category: "cs",
    players: "8 Players (4×4)",
    maxPlayers: 8,
    teamSize: 4,
    entryFee: 25,
    winPrize: "₹45/member (₹180)",
    fullDescription:
      "Clash Squad 4v4 with 2 teams of 4. There is no kill payout. Each winning team member receives ₹45, for a total winner payout of ₹180.",
    rules: [
      "2 teams, 4 players each",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winning team members receive ₹45 each",
      "Teams fill slot groups in order",
      "Room information is time-gated by the admin",
      "Admins update winners and rewards after completion",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹45 per member" },
      { label: "Teams", value: "2 teams of 4" },
    ],
  },
  {
    id: 7,
    title: "LW 1 vs 1",
    slug: "lw-1v1",
    image: "/modes-images/lw1vs1.jpeg",
    appImage: "/modes-images/app-inside/lw1vs1.jpeg",
    category: "lw",
    players: "2 Players",
    maxPlayers: 2,
    teamSize: 1,
    entryFee: 25,
    winPrize: "₹40 to Winner",
    fullDescription:
      "Lone Wolf 1v1 is a compact duel with direct winner payout. There is no kill reward. The winner receives ₹40 after admin result confirmation.",
    rules: [
      "2 players only",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winner receives ₹40",
      "Users can see occupied and open slots clearly",
      "Full matches are blocked from join",
      "Admins decide final payout after review",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40" },
      { label: "Slots", value: "2 players" },
    ],
  },
  {
    id: 8,
    title: "LW 2 vs 2",
    slug: "lw-2v2",
    image: "/modes-images/lw2vs2.jpeg",
    appImage: "/modes-images/app-inside/lw2vs2.jpeg",
    category: "lw",
    players: "4 Players (2×2)",
    maxPlayers: 4,
    teamSize: 2,
    entryFee: 25,
    winPrize: "₹40/member (₹80)",
    fullDescription:
      "Lone Wolf 2v2 runs as two paired teams. There is no kill reward. Each winning team member receives ₹40, for a total team winner payout of ₹80.",
    rules: [
      "2 teams, 2 players each",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winning team members receive ₹40 each",
      "Slots stay locked once occupied",
      "Filled matches show a join another match message",
      "Admins update final rewards and completion status",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40 per member" },
      { label: "Teams", value: "2 teams of 2" },
    ],
  },
  {
    id: 9,
    title: "HS 1 vs 1",
    slug: "hs-1v1",
    image: "/modes-images/app-inside/hs1vs1.webp",
    appImage: "/modes-images/app-inside/hs1vs1.webp",
    category: "hs",
    players: "2 Players",
    maxPlayers: 2,
    teamSize: 1,
    entryFee: 25,
    winPrize: "₹40 to Winner",
    fullDescription:
      "Headshot Only 1v1 is a precision duel where body shots do not count. There is no kill payout. The winner receives ₹40 after admin result verification.",
    rules: [
      "2 players only",
      "Headshot only mode",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winner receives ₹40",
      "Room details unlock close to match time",
      "Admins verify results before payout",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40" },
      { label: "Slots", value: "2 players" },
    ],
  },
  {
    id: 10,
    title: "HS 2 vs 2",
    slug: "hs-2v2",
    image: "/modes-images/app-inside/hs2vs2.webp",
    appImage: "/modes-images/app-inside/hs2vs2.webp",
    category: "hs",
    players: "4 Players (2×2)",
    maxPlayers: 4,
    teamSize: 2,
    entryFee: 25,
    winPrize: "₹40/member",
    fullDescription:
      "Headshot Only 2v2 features two teams of two in a tactical close-range format. There is no kill payout. Each winning member receives ₹40.",
    rules: [
      "2 teams, 2 players each",
      "Headshot only mode",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winning team members receive ₹40 each",
      "Slot grouping follows team order",
      "Admins verify winners and settle rewards",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹40 per member" },
      { label: "Teams", value: "2 teams of 2" },
    ],
  },
  {
    id: 11,
    title: "HS 4 vs 4",
    slug: "hs-4v4",
    image: "/modes-images/app-inside/hs4vs4.webp",
    appImage: "/modes-images/app-inside/hs4vs4.webp",
    category: "hs",
    players: "8 Players (4×4)",
    maxPlayers: 8,
    teamSize: 4,
    entryFee: 25,
    winPrize: "₹45/member (₹180)",
    fullDescription:
      "Headshot Only 4v4 is a team-based elimination format focused on precision and positioning. There is no kill payout. Each winning member receives ₹45.",
    rules: [
      "2 teams, 4 players each",
      "Headshot only mode",
      "Entry fee: ₹25 per player",
      "No per kill reward",
      "Winning team members receive ₹45 each",
      "Teams are assigned in grouped slots",
      "Admins publish final rewards after result entry",
    ],
    rewardBreakdown: [
      { label: "Entry Fee", value: "₹25 per player" },
      { label: "Per Kill", value: "No kill reward" },
      { label: "Winner Prize", value: "₹45 per member" },
      { label: "Teams", value: "2 teams of 4" },
    ],
  },
];

export const modesBySlug = Object.fromEntries(
  allModes.map((mode) => [mode.slug, mode])
) as Record<string, ModeConfig>;

export function buildDefaultTournamentPayloads(
  referenceDate = new Date(),
  modes: ModeConfig[] = allModes
) {
  const baseTime = new Date(referenceDate);
  baseTime.setSeconds(0, 0);
  const roundedMinutes = Math.ceil((baseTime.getMinutes() + 1) / 15) * 15;
  baseTime.setMinutes(roundedMinutes >= 60 ? 0 : roundedMinutes);
  if (roundedMinutes >= 60) {
    baseTime.setHours(baseTime.getHours() + 1);
  }

  return modes.map((mode, index) => {
    const startTime = new Date(
      baseTime.getTime() + (index + 1) * 60 * 60 * 1000
    );
    const matchSuffix = `${Date.now()}`.slice(-6);

    return {
      matchId: `TF-${mode.id}-${matchSuffix}-${index + 1}`,
      modeId: mode.id,
      title: mode.title,
      modeSlug: mode.slug,
      category: mode.category,
      maxPlayers: mode.maxPlayers,
      teamSize: mode.teamSize,
      entryFee: mode.entryFee,
      perKill: mode.perKill ?? 0,
      winPrize: mode.winPrize ?? null,
      prizePool: mode.prizePool ?? 0,
      startTime,
    };
  });
}
