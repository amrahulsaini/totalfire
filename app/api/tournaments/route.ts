import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
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

  const safeTournaments = tournaments.map((tournament) => ({
    ...tournament,
    room_id: null,
    room_password: null,
  }));

  return NextResponse.json({ tournaments: safeTournaments });
}

// POST /api/tournaments — join a tournament
export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const tournamentId = Number(payload.tournamentId);
  const gameName = payload.gameName;
  const preferredSlot = payload.preferredSlot;
  const preferredSlotsInput = Array.isArray(payload.preferredSlots)
    ? payload.preferredSlots
    : preferredSlot !== undefined && preferredSlot !== null
      ? [preferredSlot]
      : [];

  if (!tournamentId || !gameName || typeof gameName !== "string" || gameName.trim().length === 0) {
    return NextResponse.json(
      { error: "Tournament ID and in-game name are required" },
      { status: 400 }
    );
  }

  const trimmedGameName = gameName.trim();
  const sanitizedGameName = Array.from(trimmedGameName).slice(0, 100).join("");

  const normalizedPreferredSlots: number[] = Array.from(
    new Set<number>(
      preferredSlotsInput
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value) && value >= 1)
    )
  );

  let requestedSeatCount = Number(payload.seatCount);
  if (!Number.isInteger(requestedSeatCount) || requestedSeatCount <= 0) {
    requestedSeatCount = Math.max(1, normalizedPreferredSlots.length || 1);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get tournament details
    const [tournaments] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM tournaments WHERE id = ? AND is_active = 1 FOR UPDATE",
      [tournamentId]
    );

    if (tournaments.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tournament = tournaments[0];
    const teamSize = Number(tournament.team_size);
    requestedSeatCount = teamSize > 1
      ? Math.min(Math.max(requestedSeatCount, 1), teamSize)
      : 1;

    if (tournament.status !== "upcoming") {
      await connection.rollback();
      return NextResponse.json(
        { error: "This tournament is no longer accepting entries" },
        { status: 400 }
      );
    }

    // Block joining less than 1 minute before start (NOW() is IST, session tz set in db.ts)
    const [[{ minLeft }]] = await connection.query<RowDataPacket[]>(
      "SELECT TIMESTAMPDIFF(MINUTE, NOW(), ?) AS minLeft",
      [tournament.start_time]
    );
    if (Number(minLeft) < 1) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Joining closed — match starts in less than 1 minute" },
        { status: 400 }
      );
    }

    // Check if already joined
    const [existingEntry] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM tournament_entries WHERE tournament_id = ? AND user_id = ? LIMIT 1",
      [tournamentId, user.id]
    );

    if (existingEntry.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "You have already joined this tournament" },
        { status: 409 }
      );
    }

    // Check current player count
    const [countResult] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM tournament_entries WHERE tournament_id = ?",
      [tournamentId]
    );

    const currentPlayers = Number(countResult[0].count);
    if (currentPlayers >= Number(tournament.max_players)) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Tournament is full. Please join another match." },
        { status: 400 }
      );
    }

    if (currentPlayers + requestedSeatCount > Number(tournament.max_players)) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Only ${Math.max(Number(tournament.max_players) - currentPlayers, 0)} seat(s) left in this tournament`,
        },
        { status: 400 }
      );
    }

    // Determine available seats and lock preference to open slots.
    const [takenRows] = await connection.query<RowDataPacket[]>(
      "SELECT slot_number FROM tournament_entries WHERE tournament_id = ?",
      [tournamentId]
    );
    const takenSlots = new Set<number>(takenRows.map((row) => Number(row.slot_number)));
    const preferredInRange = normalizedPreferredSlots
      .filter((slot) => slot <= Number(tournament.max_players));
    const selectedSlots: number[] = [];

    for (const slot of preferredInRange) {
      if (selectedSlots.length >= requestedSeatCount) break;
      if (!takenSlots.has(slot)) {
        selectedSlots.push(slot);
        takenSlots.add(slot);
      }
    }

    for (let slot = 1; slot <= Number(tournament.max_players); slot += 1) {
      if (selectedSlots.length >= requestedSeatCount) break;
      if (!takenSlots.has(slot)) {
        selectedSlots.push(slot);
        takenSlots.add(slot);
      }
    }

    if (selectedSlots.length < requestedSeatCount) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Not enough seats are available right now" },
        { status: 400 }
      );
    }

    // Check wallet balance
    const [wallets] = await connection.query<RowDataPacket[]>(
      "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [user.id]
    );

    const balance = wallets.length > 0 ? Number(wallets[0].balance) : 0;
    const entryFee = Number(tournament.entry_fee);
    const totalEntryFee = entryFee * requestedSeatCount;

    if (balance < totalEntryFee) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: totalEntryFee,
          current: balance,
        },
        { status: 400 }
      );
    }

    // Deduct entry fee from wallet
    await connection.query(
      "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
      [totalEntryFee, user.id]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'debit', ?, ?)",
      [
        user.id,
        totalEntryFee,
        `Entry fee for ${tournament.title} (${tournament.match_id}) • ${requestedSeatCount} seat(s)`,
        tournament.match_id,
      ]
    );

    const insertedEntries: { id: number; slotNumber: number; teamNumber: number | null }[] = [];

    for (const slotNumber of selectedSlots) {
      const teamNumber =
        teamSize > 1
          ? Math.ceil(slotNumber / teamSize)
          : null;

      const [entry] = await connection.query<ResultSetHeader>(
        "INSERT INTO tournament_entries (tournament_id, user_id, slot_number, team_number, game_name) VALUES (?, ?, ?, ?, ?)",
        [tournamentId, user.id, slotNumber, teamNumber, sanitizedGameName]
      );

      insertedEntries.push({
        id: entry.insertId,
        slotNumber,
        teamNumber,
      });
    }

    // Get updated wallet balance
    const [updatedWallet] = await connection.query<RowDataPacket[]>(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [user.id]
    );

    await connection.commit();

    await createUserNotification({
      userId: user.id,
      type: "tournament",
      title: "Tournament Joined",
      message: `You joined ${tournament.title} with ${requestedSeatCount} seat(s). Entry fee INR ${totalEntryFee.toFixed(2)} was deducted from wallet.`,
      payload: {
        tournamentId: Number(tournamentId),
        matchId: String(tournament.match_id),
        slotNumbers: insertedEntries.map((entry) => entry.slotNumber),
        teamNumbers: insertedEntries
          .map((entry) => entry.teamNumber)
          .filter((teamNumber): teamNumber is number => teamNumber != null),
        seatCount: requestedSeatCount,
        entryFee: totalEntryFee,
      },
    });

    return NextResponse.json(
      {
        message: `Successfully joined ${requestedSeatCount} seat(s)!`,
        entries: insertedEntries,
        seatCount: requestedSeatCount,
        balance: Number(updatedWallet[0].balance),
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error("Tournament join failed:", error);
    return NextResponse.json(
      { error: "Could not complete join request. Please try again." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
