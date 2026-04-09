import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { verifyAdmin } from "@/lib/auth";
import pool from "@/lib/db";
import { createUserNotification } from "@/lib/notifications";

type NotificationType = "wallet" | "withdrawal" | "tournament" | "system";

function normalizeType(value: unknown): NotificationType {
  const parsed = String(value ?? "").trim().toLowerCase();
  if (parsed === "wallet") return "wallet";
  if (parsed === "withdrawal") return "withdrawal";
  if (parsed === "system") return "system";
  return "tournament";
}

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const target = String(payload.target ?? "tournament").trim().toLowerCase();
  const tournamentId = Number(payload.tournamentId);
  const title = String(payload.title ?? "").trim().slice(0, 120);
  const message = String(payload.message ?? "").trim().slice(0, 500);
  const type = normalizeType(payload.type);

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  const isBroadcast = target === "all";

  if (!isBroadcast && (!tournamentId || tournamentId <= 0)) {
    return NextResponse.json({ error: "Valid tournamentId is required" }, { status: 400 });
  }

  if (isBroadcast) {
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT id
       FROM users
       WHERE role = 'user'`
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "No users found to notify" },
        { status: 400 }
      );
    }

    await Promise.allSettled(
      userRows.map((row) =>
        createUserNotification({
          userId: Number(row.id),
          type,
          title,
          message,
          payload: {
            target: "all",
            sentByAdminId: Number(admin.id),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      recipients: userRows.length,
      target: "all",
    });
  }

  const [tournamentRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, match_id, title
     FROM tournaments
     WHERE id = ?
     LIMIT 1`,
    [tournamentId]
  );

  if (tournamentRows.length === 0) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const tournament = tournamentRows[0];

  const [userRows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT user_id
     FROM tournament_entries
     WHERE tournament_id = ?`,
    [tournamentId]
  );

  if (userRows.length === 0) {
    return NextResponse.json(
      { error: "No users joined this tournament yet" },
      { status: 400 }
    );
  }

  await Promise.allSettled(
    userRows.map((row) =>
      createUserNotification({
        userId: Number(row.user_id),
        type,
        title,
        message,
        payload: {
          tournamentId,
          matchId: String(tournament.match_id),
          tournamentTitle: String(tournament.title),
          sentByAdminId: Number(admin.id),
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    recipients: userRows.length,
    tournamentId,
    target: "tournament",
  });
}
