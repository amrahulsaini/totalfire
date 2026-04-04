import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/tournaments?mode_slug=br-ranked&status=upcoming
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeSlug = searchParams.get("mode_slug");
  const status = searchParams.get("status") || "upcoming";
  const category = searchParams.get("category");

  // Auto-transition: move any 'upcoming' tournaments whose start_time has passed to 'active'.
  // start_time is stored as IST (naive). DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE) gives
  // current IST without needing MySQL timezone tables (CONVERT_TZ fails silently if they're absent).
  await pool.query(
    `UPDATE tournaments SET status = 'active'
     WHERE status = 'upcoming' AND is_active = 1
     AND start_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)`
  );

  let query =
    "SELECT t.*, (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) as current_players FROM tournaments t WHERE t.is_active = 1";
  const params: (string | number)[] = [];

  if (modeSlug) {
    query += " AND t.mode_slug = ?";
    params.push(modeSlug);
  }
  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (category) {
    query += " AND t.category = ?";
    params.push(category);
  }

  query += " ORDER BY t.start_time ASC";

  const [tournaments] = await pool.query<RowDataPacket[]>(query, params);

  return NextResponse.json({ tournaments });
}

// POST /api/tournaments — join a tournament
export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tournamentId, preferredSlot, gameName } = await request.json();

  if (!tournamentId || !gameName || typeof gameName !== "string" || gameName.trim().length === 0) {
    return NextResponse.json(
      { error: "Tournament ID and in-game name are required" },
      { status: 400 }
    );
  }

  const sanitizedGameName = gameName.trim().slice(0, 100);

  // Get tournament details
  const [tournaments] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM tournaments WHERE id = ? AND is_active = 1",
    [tournamentId]
  );

  if (tournaments.length === 0) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  const tournament = tournaments[0];

  if (tournament.status !== "upcoming") {
    return NextResponse.json(
      { error: "This tournament is no longer accepting entries" },
      { status: 400 }
    );
  }

  // Block joining less than 1 minute before start (NOW() is IST, session tz set in db.ts)
  const [[{ minLeft }]] = await pool.query<RowDataPacket[]>(
    "SELECT TIMESTAMPDIFF(MINUTE, NOW(), ?) AS minLeft",
    [tournament.start_time]
  );
  if (Number(minLeft) < 1) {
    return NextResponse.json(
      { error: "Joining closed — match starts in less than 1 minute" },
      { status: 400 }
    );
  }

  // Check if already joined
  const [existingEntry] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM tournament_entries WHERE tournament_id = ? AND user_id = ?",
    [tournamentId, user.id]
  );

  if (existingEntry.length > 0) {
    return NextResponse.json(
      { error: "You have already joined this tournament" },
      { status: 409 }
    );
  }

  // Check current player count
  const [countResult] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM tournament_entries WHERE tournament_id = ?",
    [tournamentId]
  );

  const currentPlayers = countResult[0].count;
  if (currentPlayers >= tournament.max_players) {
    return NextResponse.json(
      { error: "Tournament is full. Please join another match." },
      { status: 400 }
    );
  }

  // Check wallet balance
  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [user.id]
  );

  const balance = wallets.length > 0 ? Number(wallets[0].balance) : 0;
  const entryFee = Number(tournament.entry_fee);

  if (balance < entryFee) {
    return NextResponse.json(
      {
        error: "Insufficient wallet balance",
        required: entryFee,
        current: balance,
      },
      { status: 400 }
    );
  }

  // Deduct entry fee from wallet
  await pool.query(
    "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
    [entryFee, user.id]
  );

  // Record transaction
  await pool.query(
    "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'debit', ?, ?)",
    [
      user.id,
      entryFee,
      `Entry fee for ${tournament.title} (${tournament.match_id})`,
      tournament.match_id,
    ]
  );

  // Assign slot number — use preferred slot if available, otherwise next sequential
  let slotNumber = currentPlayers + 1;
  if (preferredSlot && preferredSlot >= 1 && preferredSlot <= tournament.max_players) {
    // Check if preferred slot is taken
    const [slotCheck] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM tournament_entries WHERE tournament_id = ? AND slot_number = ?",
      [tournamentId, preferredSlot]
    );
    if (slotCheck.length === 0) {
      slotNumber = preferredSlot;
    }
  }
  const teamNumber =
    tournament.team_size > 1
      ? Math.ceil(slotNumber / tournament.team_size)
      : null;

  // Create entry
  const [entry] = await pool.query<ResultSetHeader>(
    "INSERT INTO tournament_entries (tournament_id, user_id, slot_number, team_number, game_name) VALUES (?, ?, ?, ?, ?)",
    [tournamentId, user.id, slotNumber, teamNumber, sanitizedGameName]
  );

  // Get updated wallet balance
  const [updatedWallet] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [user.id]
  );

  return NextResponse.json(
    {
      message: "Successfully joined tournament!",
      entry: {
        id: entry.insertId,
        slotNumber,
        teamNumber,
      },
      balance: Number(updatedWallet[0].balance),
    },
    { status: 201 }
  );
}
