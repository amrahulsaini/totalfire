import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { createUserNotification, notifyTournamentParticipants } from "@/lib/notifications";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0 || rows[0].role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// POST /api/admin/results — submit match results (kills + auto-calculate rewards)
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { tournamentId, results } = await request.json();

  if (!tournamentId || !results || !Array.isArray(results)) {
    return NextResponse.json(
      { error: "tournamentId and results array required" },
      { status: 400 }
    );
  }

  // Get tournament info
  const [tournaments] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM tournaments WHERE id = ?",
    [tournamentId]
  );

  if (tournaments.length === 0) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const tournament = tournaments[0];
  const perKill = Number(tournament.per_kill);

  // results format: [{ username: "user1", kills: 5, isWinner: true }, ...]
  for (const r of results) {
    // Find user by username
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ?",
      [r.username.toLowerCase()]
    );

    if (users.length === 0) continue;
    const userId = users[0].id;

    // Calculate reward: kills * perKill + winPrize (if winner)
    let reward = r.kills * perKill;

    // For CS/LW modes, winner gets the winPrize amount
    if (r.isWinner && tournament.win_prize) {
      // Parse numeric value from win_prize string like "₹40 to Winner" or "₹40/member"
      const prizeMatch = tournament.win_prize.match(/₹?(\d+)/);
      if (prizeMatch) {
        reward += parseInt(prizeMatch[1]);
      }
    }

    // Insert or update match result
    await pool.query(
      `INSERT INTO match_results (tournament_id, user_id, kills, reward_amount, is_winner)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE kills = VALUES(kills), reward_amount = VALUES(reward_amount), is_winner = VALUES(is_winner)`,
      [tournamentId, userId, r.kills, reward, r.isWinner ? 1 : 0]
    );

    // Credit reward to wallet
    if (reward > 0) {
      await pool.query(
        "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
        [reward, userId]
      );

      await pool.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', ?, ?)",
        [
          userId,
          reward,
          `Reward from ${tournament.title} (${r.kills} kills${
            r.isWinner ? " + winner" : ""
          })`,
          tournament.match_id,
        ]
      );

      await createUserNotification({
        userId,
        type: "wallet",
        title: "Match Reward Credited",
        message: `INR ${reward.toFixed(2)} credited for ${tournament.title}.`,
        payload: {
          tournamentId: Number(tournamentId),
          kills: Number(r.kills ?? 0),
          isWinner: Boolean(r.isWinner),
          reward,
        },
      });
    }
  }

  // Mark tournament as completed
  await pool.query("UPDATE tournaments SET status = 'completed' WHERE id = ?", [
    tournamentId,
  ]);

  // Update entries status
  await pool.query(
    "UPDATE tournament_entries SET status = 'completed' WHERE tournament_id = ?",
    [tournamentId]
  );

  await notifyTournamentParticipants({
    tournamentId: Number(tournamentId),
    type: "tournament",
    title: "Tournament Completed",
    message: `${tournament.title} results are now published.`,
    payload: { tournamentId: Number(tournamentId), matchId: String(tournament.match_id) },
  });

  return NextResponse.json({ message: "Results submitted and rewards distributed" });
}

// GET /api/admin/results?tournamentId=1 — get results for a tournament
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get("tournamentId");

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId required" }, { status: 400 });
  }

  const [results] = await pool.query<RowDataPacket[]>(
    `SELECT mr.*, u.username, u.full_name
     FROM match_results mr
     JOIN users u ON mr.user_id = u.id
     WHERE mr.tournament_id = ?
     ORDER BY mr.kills DESC`,
    [tournamentId]
  );

  return NextResponse.json({ results });
}
