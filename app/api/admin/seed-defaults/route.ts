import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import { getModeCatalog } from "@/lib/mode-catalog";
import { buildDefaultTournamentPayloads } from "@/lib/modes";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const modes = await getModeCatalog();
  const defaults = buildDefaultTournamentPayloads(new Date(), modes);
  let created = 0;
  let skipped = 0;

  for (const tournament of defaults) {
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM tournaments
       WHERE mode_slug = ? AND status IN ('upcoming', 'active') AND is_active = 1`,
      [tournament.modeSlug]
    );

    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO tournaments (
        match_id,
        mode_id,
        title,
        mode_slug,
        category,
        max_players,
        team_size,
        entry_fee,
        per_kill,
        win_prize,
        prize_pool,
        start_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tournament.matchId,
        tournament.modeId,
        tournament.title,
        tournament.modeSlug,
        tournament.category,
        tournament.maxPlayers,
        tournament.teamSize,
        tournament.entryFee,
        tournament.perKill,
        tournament.winPrize,
        tournament.prizePool,
        tournament.startTime,
      ]
    );

    created += 1;
  }

  return NextResponse.json({
    message: "Default tournaments processed",
    created,
    skipped,
  });
}
