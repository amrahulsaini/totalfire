import pool from "@/lib/db";
import { getFirebaseMessaging } from "@/lib/firebase-admin";
import type { RowDataPacket } from "mysql2";

type PushCategory = "wallet" | "withdrawal" | "tournament" | "system";

interface SendPushToUserInput {
  userId: number;
  category: PushCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const ANDROID_PUSH_CHANNEL_ID = "totalfire_alerts_v2";

function toStringMap(data?: Record<string, unknown>): Record<string, string> {
  if (!data) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
}

function isCategoryAllowed(category: PushCategory, pref: RowDataPacket): boolean {
  if (Number(pref.allow_push) !== 1) {
    return false;
  }

  switch (category) {
    case "wallet":
      return Number(pref.allow_wallet) === 1;
    case "withdrawal":
      return Number(pref.allow_withdrawal) === 1;
    case "tournament":
      return Number(pref.allow_tournament) === 1;
    default:
      return true;
  }
}

export async function sendPushToUser(input: SendPushToUserInput) {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return;
    }

    const [prefRows] = await pool.query<RowDataPacket[]>(
      `SELECT allow_push, allow_wallet, allow_withdrawal, allow_tournament
       FROM user_notification_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [input.userId]
    );

    if (prefRows.length > 0 && !isCategoryAllowed(input.category, prefRows[0])) {
      return;
    }

    const [tokenRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, fcm_token
       FROM user_push_tokens
       WHERE user_id = ? AND is_active = 1`,
      [input.userId]
    );

    if (tokenRows.length === 0) {
      return;
    }

    const tokens = tokenRows
      .map((row) => row.fcm_token?.toString() ?? "")
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: {
        title: input.title,
        body: input.body,
        category: input.category,
        ...toStringMap(input.data),
      },
      android: {
        priority: "high",
        notification: {
          channelId: ANDROID_PUSH_CHANNEL_ID,
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
          priority: "max",
        },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    for (let i = 0; i < response.responses.length; i += 1) {
      const sendResult = response.responses[i];
      const tokenRow = tokenRows[i];
      const tokenId = tokenRow ? Number(tokenRow.id) : null;

      if (sendResult.success) {
        continue;
      }

      const errorCode = sendResult.error?.code ?? "unknown";

      if (
        errorCode.includes("registration-token-not-registered") ||
        errorCode.includes("invalid-registration-token")
      ) {
        await pool.query(
          "UPDATE user_push_tokens SET is_active = 0 WHERE id = ?",
          [tokenId]
        );
      }
    }
  } catch (error) {
    console.error("FCM send error:", error);
  }
}
