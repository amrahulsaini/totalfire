import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// GET /api/tournaments/[id] — get tournament details with all entries/slots
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auto-transition: move any 'upcoming' tournaments whose start_time has passed to 'active'.
  // Uses DATE_ADD(UTC_TIMESTAMP()) to compare IST-stored times without needing timezone tables.
  await pool.query(
    `UPDATE tournaments SET status = 'active'
     WHERE status = 'upcoming' AND is_active = 1
     AND start_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)`
  );

  const [tournaments] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM tournaments WHERE id = ?",
    [id]
  );

  if (tournaments.length === 0) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  const tournament = tournaments[0];

  // Get all entries with user info
  const [entries] = await pool.query<RowDataPacket[]>(
    `SELECT te.slot_number, te.team_number, te.status, te.game_name, u.username, u.full_name
     FROM tournament_entries te
     JOIN users u ON te.user_id = u.id
     WHERE te.tournament_id = ?
     ORDER BY te.slot_number ASC`,
    [id]
  );

  // Get match results if completed
  let results: RowDataPacket[] = [];
  if (tournament.status === "completed") {
    const [res] = await pool.query<RowDataPacket[]>(
      `SELECT mr.kills, mr.reward_amount, mr.is_winner, u.username, u.full_name,
              te.game_name
       FROM match_results mr
       JOIN users u ON mr.user_id = u.id
       LEFT JOIN tournament_entries te
         ON te.tournament_id = mr.tournament_id AND te.user_id = mr.user_id
       WHERE mr.tournament_id = ?
       ORDER BY mr.is_winner DESC, mr.kills DESC`,
      [id]
    );
    // Assign positions with tie-safe ranking (same is_winner + same kills = same position)
    let pos = 1;
    const positioned = res.map((row, i, arr) => {
      if (i > 0) {
        const prev = arr[i - 1];
        if (row.is_winner !== prev.is_winner || row.kills !== prev.kills) {
          pos = i + 1;
        }
      }
      return { ...row, position: pos };
    });
    results = positioned;
  }

  // Check if requesting user has joined (if authenticated)
  let userEntry = null;
  const user = await verifyUser(request);
  if (user) {
    const [ue] = await pool.query<RowDataPacket[]>(
      "SELECT slot_number, team_number, status FROM tournament_entries WHERE tournament_id = ? AND user_id = ?",
      [id, user.id]
    );
    if (ue.length > 0) userEntry = ue[0];
  }

  // Show room info only 5 minutes before start.
  // start_time stored as naive IST string "2026-04-03 15:20:00" — parse with explicit +05:30.
  const startTime = new Date(
    (tournament.start_time as string).replace(' ', 'T') + '+05:30'
  );
  const timeDiffMinutes = (startTime.getTime() - Date.now()) / (1000 * 60);
  const showRoom = timeDiffMinutes <= 5 && tournament.room_id;

  return NextResponse.json({
    tournament: {
      ...tournament,
      room_id: showRoom ? tournament.room_id : null,
      room_password: showRoom ? tournament.room_password : null,
      current_players: entries.length,
    },
    entries,
    results,
    userEntry,
  });
}
