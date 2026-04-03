import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// GET /api/tournaments/my — get user's tournaments
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // upcoming, active, completed

  // Auto-transition: move any 'upcoming' tournaments whose start_time has passed to 'active'.
  // Uses DATE_ADD(UTC_TIMESTAMP()) to compare IST-stored times without needing timezone tables.
  await pool.query(
    `UPDATE tournaments SET status = 'active'
     WHERE status = 'upcoming' AND is_active = 1
     AND start_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)`
  );

  let query = `
    SELECT t.*, te.slot_number, te.team_number, te.status as entry_status,
    (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as current_players
    FROM tournaments t
    JOIN tournament_entries te ON t.id = te.tournament_id
    WHERE te.user_id = ?
  `;
  const params: (string | number)[] = [user.id];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }

  query += " ORDER BY t.start_time ASC";

  const [tournaments] = await pool.query<RowDataPacket[]>(query, params);

  // Add room info only for tournaments within 5 minutes of start
  const enriched = tournaments.map((t) => {
    // start_time is naive IST string "2026-04-03 15:20:00" — parse with explicit +05:30
    const startTime = new Date(
      (t.start_time as string).replace(' ', 'T') + '+05:30'
    );
    const timeDiffMinutes =
      (startTime.getTime() - Date.now()) / (1000 * 60);
    const showRoom = timeDiffMinutes <= 5 && t.room_id;
    return {
      ...t,
      room_id: showRoom ? t.room_id : null,
      room_password: showRoom ? t.room_password : null,
    };
  });

  return NextResponse.json({ tournaments: enriched });
}
