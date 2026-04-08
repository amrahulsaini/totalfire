import pool from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import type { RowDataPacket } from "mysql2";

export type AppNotificationType =
  | "wallet"
  | "withdrawal"
  | "tournament"
  | "system";

interface CreateNotificationInput {
  userId: number;
  type: AppNotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}

function stringifyPayload(payload?: Record<string, unknown>) {
  if (!payload) {
    return null;
  }
  return JSON.stringify(payload);
}

export async function createUserNotification(input: CreateNotificationInput) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.type,
      input.title,
      input.message,
      stringifyPayload(input.payload),
    ]
  );

  void sendPushToUser({
    userId: input.userId,
    category: input.type,
    title: input.title,
    body: input.message,
    data: input.payload,
  });
}

interface NotifyTournamentParticipantsInput {
  tournamentId: number;
  type: AppNotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}

export async function notifyTournamentParticipants(
  input: NotifyTournamentParticipantsInput
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT user_id FROM tournament_entries WHERE tournament_id = ?",
    [input.tournamentId]
  );

  for (const row of rows) {
    await createUserNotification({
      userId: Number(row.user_id),
      type: input.type,
      title: input.title,
      message: input.message,
      payload: input.payload,
    });
  }
}
