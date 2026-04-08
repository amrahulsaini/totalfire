import pool from "@/lib/db";
import {
  allModes,
  type ModeConfig,
  type RewardBreakdownItem,
} from "@/lib/modes";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

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

async function syncModeCatalog() {
  for (const [index, mode] of allModes.entries()) {
    await pool.query<ResultSetHeader>(
      `INSERT INTO modes (
        id,
        title,
        slug,
        image,
        app_image,
        category,
        players_label,
        max_players,
        team_size,
        entry_fee,
        per_kill,
        prize_pool,
        win_prize,
        full_description,
        rules_json,
        reward_breakdown_json,
        sort_order,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        image = VALUES(image),
        app_image = VALUES(app_image),
        category = VALUES(category),
        players_label = VALUES(players_label),
        max_players = VALUES(max_players),
        team_size = VALUES(team_size),
        entry_fee = VALUES(entry_fee),
        per_kill = VALUES(per_kill),
        prize_pool = VALUES(prize_pool),
        win_prize = VALUES(win_prize),
        full_description = VALUES(full_description),
        rules_json = VALUES(rules_json),
        reward_breakdown_json = VALUES(reward_breakdown_json),
        sort_order = VALUES(sort_order),
        is_active = VALUES(is_active)`,
      [
        mode.id,
        mode.title,
        mode.slug,
        mode.image,
        mode.appImage,
        mode.category,
        mode.players,
        mode.maxPlayers,
        mode.teamSize,
        mode.entryFee,
        mode.perKill ?? null,
        mode.prizePool ?? null,
        mode.winPrize ?? null,
        mode.fullDescription,
        JSON.stringify(mode.rules),
        JSON.stringify(mode.rewardBreakdown),
        index + 1,
      ]
    );
  }
}

export async function getModeCatalog() {
  try {
    await syncModeCatalog();

    const [rows] = await pool.query<ModeRow[]>(
      `SELECT * FROM modes
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );

    if (rows.length > 0) {
      return rows.map(mapModeRow);
    }
  } catch {
    return allModes;
  }

  return allModes;
}

export async function getModeCatalogBySlug(slug: string) {
  try {
    await syncModeCatalog();

    const [rows] = await pool.query<ModeRow[]>(
      `SELECT * FROM modes
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );

    if (rows.length > 0) {
      return mapModeRow(rows[0]);
    }
  } catch {
    return allModes.find((mode) => mode.slug === slug) ?? null;
  }

  return allModes.find((mode) => mode.slug === slug) ?? null;
}