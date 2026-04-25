import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import {
  cashfree,
  cashfreeEnvironmentName,
  getCashfreeErrorMessage,
  getCashfreeHostedCheckoutUrl,
  getCashfreeNotifyUrl,
  getCashfreeReturnUrl,
  isCashfreeConfigured,
} from "@/lib/cashfree";
import type { RowDataPacket } from "mysql2";

type CashfreeUserRow = RowDataPacket & {
  email: string | null;
  full_name: string | null;
  id: number;
  mobile: string | null;
  username: string;
};

function parseAmount(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function normalizeMobile(value: unknown) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: "Cashfree is not configured on server" },
      { status: 500 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const amount = parseAmount(payload.amount);
  const MIN_TOPUP_AMOUNT = 25;
  if (!amount) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (amount < MIN_TOPUP_AMOUNT) {
    return NextResponse.json(
      { error: `Minimum add money amount is INR ${MIN_TOPUP_AMOUNT}` },
      { status: 400 }
    );
  }

  try {
    const [users] = await pool.query<CashfreeUserRow[]>(
      `SELECT id, username, full_name, email, mobile
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [user.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRow = users[0];
    const mobile = normalizeMobile(userRow.mobile);

    if (mobile.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is required for Cashfree payments" },
        { status: 400 }
      );
    }

    const orderId = `TFWALLET_${user.id}_${Date.now()}`;
    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `TFUSER_${user.id}`,
        customer_phone: mobile,
        customer_name: userRow.full_name || userRow.username || "TotalFire User",
        customer_email: userRow.email || "support@totalfire.in",
      },
      order_meta: {
        notify_url: getCashfreeNotifyUrl(),
        return_url: getCashfreeReturnUrl(),
      },
      order_note: "Wallet top-up",
    };

    const response = await cashfree.PGCreateOrder(orderRequest);
    const createdOrderId = response.data.order_id?.toString().trim();
    const paymentSessionId = response.data.payment_session_id
      ?.toString()
      .trim();

    if (!createdOrderId || !paymentSessionId) {
      throw new Error("Cashfree create order response was missing checkout data");
    }

    await pool.query(
      `INSERT INTO wallet_payment_transactions (
        user_id,
        provider,
        gateway_order_id,
        amount,
        currency,
        status,
        notes,
        raw_payload
      ) VALUES (?, 'cashfree', ?, ?, ?, 'created', ?, ?)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        currency = VALUES(currency),
        status = VALUES(status),
        notes = VALUES(notes),
        raw_payload = VALUES(raw_payload),
        updated_at = CURRENT_TIMESTAMP`,
      [
        user.id,
        createdOrderId,
        amount,
        response.data.order_currency || "INR",
        "Cashfree wallet order created",
        JSON.stringify(response.data),
      ]
    );

    const paymentLink =
      typeof (response.data as { payment_link?: unknown }).payment_link === "string"
        ? (response.data as { payment_link?: string }).payment_link
        : null;

    return NextResponse.json({
      message: "Payment order created",
      orderId: createdOrderId,
      amount: amount,
      checkoutUrl: getCashfreeHostedCheckoutUrl({
        orderId: createdOrderId,
        paymentSessionId,
        environment: cashfreeEnvironmentName,
      }),
      currency: response.data.order_currency || "INR",
      environment: cashfreeEnvironmentName,
      paymentUrl: paymentLink,
      paymentSessionId,
    });
  } catch (error) {
    console.error("Cashfree order error:", error);
    return NextResponse.json(
      { error: getCashfreeErrorMessage(error, "Failed to create order") },
      { status: 502 }
    );
  }
}

