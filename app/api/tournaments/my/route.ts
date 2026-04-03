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

  // Add room info only for upcoming tournaments within 5 minutes
  const now = new Date();
  const enriched = tournaments.map((t) => {
    const startTime = new Date(t.start_time);
    const timeDiffMinutes =
      (startTime.getTime() - now.getTime()) / (1000 * 60);
    const showRoom = timeDiffMinutes <= 5 && t.room_id;
    return {
      ...t,
      room_id: showRoom ? t.room_id : null,
      room_password: showRoom ? t.room_password : null,
    };
  });

  return NextResponse.json({ tournaments: enriched });
}
