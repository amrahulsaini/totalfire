import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Auto-transition: move any 'upcoming' tournaments whose start_time has passed to 'active'
  await pool.query(
    `UPDATE tournaments SET status = 'active'
     WHERE status = 'upcoming' AND is_active = 1
     AND start_time <= NOW()`
  );

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const modeSlug = searchParams.get("mode_slug");

  let query = `
    SELECT t.*,
    (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) as current_players
    FROM tournaments t
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (modeSlug) {
    query += " AND t.mode_slug = ?";
    params.push(modeSlug);
  }

  query += " ORDER BY t.start_time ASC";

  const [tournaments] = await pool.query<RowDataPacket[]>(query, params);
  return NextResponse.json({ tournaments });
}

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const {
    matchId,
    modeId,
    title,
    modeSlug,
    category,
    maxPlayers,
    teamSize,
    entryFee,
    perKill,
    winPrize,
    prizePool,
    startTime,
  } = body;

  if (!matchId || !title || !modeSlug || !category || !maxPlayers || !entryFee || !startTime) {
    return NextResponse.json(
      { error: "Required fields missing" },
      { status: 400 }
    );
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM tournaments WHERE match_id = ?",
    [matchId]
  );

  if (existing.length > 0) {
    return NextResponse.json({ error: "Match ID already exists" }, { status: 409 });
  }

  const [result] = await pool.query<ResultSetHeader>(
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
      matchId,
      modeId ?? 0,
      title,
      modeSlug,
      category,
      maxPlayers,
      teamSize ?? 1,
      entryFee,
      perKill ?? 0,
      winPrize ?? null,
      prizePool ?? 0,
      startTime,
    ]
  );

  return NextResponse.json(
    {
      message: "Tournament created",
      tournament: { id: result.insertId, matchId },
    },
    { status: 201 }
  );
}

export async function PUT(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updateFields } = body;

  if (!id) {
    return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
  }

  const allowedFields: Record<string, string> = {
    title: "title",
    entryFee: "entry_fee",
    perKill: "per_kill",
    winPrize: "win_prize",
    prizePool: "prize_pool",
    roomId: "room_id",
    roomPassword: "room_password",
    startTime: "start_time",
    status: "status",
    isActive: "is_active",
    maxPlayers: "max_players",
    teamSize: "team_size",
  };

  const setClauses: string[] = [];
  const values: Array<string | number | null> = [];

  for (const [key, value] of Object.entries(updateFields)) {
    const dbField = allowedFields[key];
    if (!dbField || value === undefined) {
      continue;
    }

    setClauses.push(`${dbField} = ?`);
    values.push(value as string | number | null);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  values.push(id as number);
  await pool.query(
    `UPDATE tournaments SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return NextResponse.json({ message: "Tournament updated" });
}

export async function DELETE(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
  }

  await pool.query(
    "UPDATE tournaments SET is_active = 0, status = 'cancelled' WHERE id = ?",
    [id]
  );

  return NextResponse.json({ message: "Tournament deactivated" });
}
