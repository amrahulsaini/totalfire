import pool from "@/lib/db";
import type { ModeConfig, RewardBreakdownItem } from "@/lib/modes";
import type { RowDataPacket } from "mysql2";

type ModeRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  image: string;
  app_image: string;
  category: "br" | "cs" | "lw" | "hs";
  players_label: string;
  max_players: number;
  team_size: number;
  entry_fee: number | string;
  per_kill: number | string | null;
  prize_pool: number | string | null;
  win_prize: string | null;
  full_description: string;
  rules_json: string | string[];
  reward_breakdown_json: string | RewardBreakdownItem[];
  sort_order: number;
};

function parseJsonValue<T>(value: string | T, fallback: T): T {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapModeRow(row: ModeRow): ModeConfig {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    image: row.image,
    appImage: row.app_image,
    category: row.category,
    players: row.players_label,
    maxPlayers: Number(row.max_players),
    teamSize: Number(row.team_size),
    entryFee: Number(row.entry_fee),
    perKill: row.per_kill === null ? undefined : Number(row.per_kill),
    prizePool: row.prize_pool === null ? undefined : Number(row.prize_pool),
    winPrize: row.win_prize ?? undefined,
    fullDescription: row.full_description,
    rules: parseJsonValue<string[]>(row.rules_json, []),
    rewardBreakdown: parseJsonValue<RewardBreakdownItem[]>(
      row.reward_breakdown_json,
      []
    ),
  };
}

export async function getModeCatalog() {
  try {
    const [rows] = await pool.query<ModeRow[]>(
      `SELECT * FROM modes
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );
    return rows.map(mapModeRow);
  } catch {
    return [];
  }
}

export async function getModeCatalogBySlug(slug: string) {
  try {
    const [rows] = await pool.query<ModeRow[]>(
      `SELECT * FROM modes
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return null;
    }
    return mapModeRow(rows[0]);
  } catch {
    return null;
  }
}