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
    `SELECT te.slot_number, te.team_number, te.status, u.username, u.full_name
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
      `SELECT mr.kills, mr.reward_amount, mr.is_winner, u.username, u.full_name
       FROM match_results mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.tournament_id = ?
       ORDER BY mr.kills DESC`,
      [id]
    );
    results = res;
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

  // Show room info only 5 minutes before start (IST)
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const startTime = new Date(tournament.start_time);
  const timeDiffMinutes =
    (startTime.getTime() - nowIST.getTime()) / (1000 * 60);
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
