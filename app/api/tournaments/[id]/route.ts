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
     AND start_time <= NOW()`
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
       LEFT JOIN (
         SELECT te1.tournament_id, te1.user_id, te1.game_name
         FROM tournament_entries te1
         INNER JOIN (
           SELECT tournament_id, user_id, MAX(id) AS latest_id
           FROM tournament_entries
           WHERE tournament_id = ?
           GROUP BY tournament_id, user_id
         ) latest ON latest.latest_id = te1.id
       ) te ON te.tournament_id = mr.tournament_id AND te.user_id = mr.user_id
       WHERE mr.tournament_id = ?
       ORDER BY mr.is_winner DESC, mr.kills DESC`,
      [id, id]
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
  let userEntries: RowDataPacket[] = [];
  const user = await verifyUser(request);
  if (user) {
    const [ue] = await pool.query<RowDataPacket[]>(
      `SELECT slot_number, team_number, status
       FROM tournament_entries
       WHERE tournament_id = ? AND user_id = ?
       ORDER BY slot_number ASC`,
      [id, user.id]
    );
    userEntries = ue;
    if (ue.length > 0) userEntry = ue[0];
  }

  // Show room info only to joined users during the reveal window:
  // 5 minutes before start until 5 minutes after start.
  // start_time is stored as IST string; session timezone is now IST so we compare
  // by querying MySQL for the diff instead of doing JS timezone gymnastics.
  const [[{ minFromStart }]] = await pool.query<RowDataPacket[]>(
    "SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) AS minFromStart",
    [tournament.start_time]
  );
  const joinedByRequester = userEntries.length > 0;
  const withinRevealWindow = Number(minFromStart) >= -5 && Number(minFromStart) <= 5;
  const showRoom = Boolean(tournament.room_id) && joinedByRequester && withinRevealWindow;

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
    userEntries,
  });
}
