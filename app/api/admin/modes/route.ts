import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyAdmin } from "@/lib/auth";
import pool from "@/lib/db";

type ModeCategory = "br" | "cs" | "lw" | "hs";

interface ModePayload {
  id?: number;
  title?: string;
  slug?: string;
  image?: string;
  appImage?: string;
  category?: ModeCategory;
  players?: string;
  maxPlayers?: number;
  teamSize?: number;
  entryFee?: number;
  perKill?: number | null;
  prizePool?: number | null;
  winPrize?: string | null;
  fullDescription?: string;
  rules?: string[];
  rewardBreakdown?: Array<{ label: string; value: string }>;
  sortOrder?: number;
  isActive?: boolean;
}

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeCategory(value: unknown): ModeCategory {
  const parsed = String(value ?? "").trim().toLowerCase();
  if (parsed === "cs") return "cs";
  if (parsed === "lw") return "lw";
  if (parsed === "hs") return "hs";
  return "br";
}

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
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
     FROM modes
     ORDER BY sort_order ASC, id ASC`
  );

  const modes = rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    image: String(row.image ?? ""),
    appImage: String(row.app_image ?? ""),
    category: normalizeCategory(row.category),
    players: String(row.players_label ?? ""),
    maxPlayers: Number(row.max_players ?? 0),
    teamSize: Number(row.team_size ?? 1),
    entryFee: Number(row.entry_fee ?? 0),
    perKill: row.per_kill == null ? null : Number(row.per_kill),
    prizePool: row.prize_pool == null ? null : Number(row.prize_pool),
    winPrize: row.win_prize == null ? null : String(row.win_prize),
    fullDescription: String(row.full_description ?? ""),
    rules: parseJsonArray<string>(row.rules_json, []),
    rewardBreakdown: parseJsonArray<{ label: string; value: string }>(
      row.reward_breakdown_json,
      []
    ),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Number(row.is_active ?? 1) === 1,
  }));

  return NextResponse.json({ modes });
}

export async function PUT(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => ({}))) as ModePayload;
  const id = Number(payload.id);

  if (!id || id <= 0) {
    return NextResponse.json({ error: "Valid mode id is required" }, { status: 400 });
  }

  const title = String(payload.title ?? "").trim().slice(0, 100);
  const slug = String(payload.slug ?? "").trim().toLowerCase().slice(0, 50);
  const image = String(payload.image ?? "").trim().slice(0, 255);
  const appImage = String(payload.appImage ?? "").trim().slice(0, 255);
  const players = String(payload.players ?? "").trim().slice(0, 60);
  const fullDescription = String(payload.fullDescription ?? "").trim();

  if (!title || !slug || !image || !appImage || !players || !fullDescription) {
    return NextResponse.json({ error: "Required mode fields are missing" }, { status: 400 });
  }

  const rules = Array.isArray(payload.rules)
    ? payload.rules.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const rewardBreakdown = Array.isArray(payload.rewardBreakdown)
    ? payload.rewardBreakdown
        .map((item) => ({
          label: String(item.label ?? "").trim(),
          value: String(item.value ?? "").trim(),
        }))
        .filter((item) => item.label && item.value)
    : [];

  if (rules.length === 0 || rewardBreakdown.length === 0) {
    return NextResponse.json(
      { error: "Rules and reward breakdown must not be empty" },
      { status: 400 }
    );
  }

  const category = normalizeCategory(payload.category);
  const maxPlayers = Math.max(1, Number(payload.maxPlayers ?? 1));
  const teamSize = Math.max(1, Number(payload.teamSize ?? 1));
  const entryFee = Math.max(0, Number(payload.entryFee ?? 0));
  const perKillRaw = payload.perKill;
  const prizePoolRaw = payload.prizePool;
  const perKill =
    perKillRaw === null || perKillRaw === undefined
      ? null
      : Math.max(0, Number(perKillRaw));
  const prizePool =
    prizePoolRaw === null || prizePoolRaw === undefined
      ? null
      : Math.max(0, Number(prizePoolRaw));
  const winPrize =
    payload.winPrize == null || String(payload.winPrize).trim() === ""
      ? null
      : String(payload.winPrize).trim().slice(0, 100);
  const sortOrder = Math.max(1, Number(payload.sortOrder ?? id));
  const isActive = payload.isActive === false ? 0 : 1;

  const [slugRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM modes WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, id]
  );
  if (slugRows.length > 0) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE modes
     SET title = ?,
         slug = ?,
         image = ?,
         app_image = ?,
         category = ?,
         players_label = ?,
         max_players = ?,
         team_size = ?,
         entry_fee = ?,
         per_kill = ?,
         prize_pool = ?,
         win_prize = ?,
         full_description = ?,
         rules_json = ?,
         reward_breakdown_json = ?,
         sort_order = ?,
         is_active = ?
     WHERE id = ?`,
    [
      title,
      slug,
      image,
      appImage,
      category,
      players,
      maxPlayers,
      teamSize,
      entryFee,
      perKill,
      prizePool,
      winPrize,
      fullDescription,
      JSON.stringify(rules),
      JSON.stringify(rewardBreakdown),
      sortOrder,
      isActive,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Mode not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
