import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

const SPACEPAY_CREATE_URL = "https://spacepay.in/api/payment/v1/pay";
const SPACEPAY_STATUS_URL = "https://spacepay.in/api/payment/v1/order-status";
const SPACEPAY_SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "PAID",
  "COMPLETED",
  "CAPTURED",
]);

function parsePositiveAmount(value: unknown): number | null {
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

function normalizeMobile(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function isTruthyStatus(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "success" ||
      normalized === "ok"
    );
  }

  return false;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function parseJsonRecord(value: string): Record<string, unknown> {
  if (!value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return asRecord(parsed);
  } catch {
    return {};
  }
}

function getSpacepayKeys() {
  const publicKey = process.env.SPACEPAY_PUBLIC_KEY;
  const secretKey = process.env.SPACEPAY_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return null;
  }

  return { publicKey, secretKey };
}

async function getWalletBalance(userId: number) {
  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [userId]
  );

  if (wallets.length === 0) {
    await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [
      userId,
    ]);
    return 0;
  }

  return Number(wallets[0].balance);
}

async function getUserMobile(userId: number) {
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT mobile FROM users WHERE id = ?",
    [userId]
  );

  if (users.length === 0) {
    return null;
  }

  return normalizeMobile(users[0].mobile);
}

// GET /api/wallet — get wallet balance
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await getWalletBalance(user.id);
  return NextResponse.json({ balance });
}

// POST /api/wallet — create a Spacepay payment order for wallet top-up
export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = getSpacepayKeys();
  if (!keys) {
    return NextResponse.json(
      { error: "Spacepay is not configured on server" },
      { status: 500 }
    );
  }

  let payload: { amount?: unknown };
  try {
    payload = (await request.json()) as { amount?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const amount = parsePositiveAmount(payload.amount);
  if (!amount) {
    return NextResponse.json(
      { error: "Amount must be positive" },
      { status: 400 }
    );
  }

  const userMobile = await getUserMobile(user.id);
  if (!userMobile || userMobile.length !== 10) {
    return NextResponse.json(
      { error: "Valid 10-digit mobile number is required for payment" },
      { status: 400 }
    );
  }

  const orderId = `TFWALLET_${user.id}_${Date.now()}`;
  const redirectUrl =
    process.env.SPACEPAY_REDIRECT_URL ??
    "https://totalfire.in?wallet=payment-complete";

  try {
    const spacepayResponse = await fetch(SPACEPAY_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_key: keys.publicKey,
        secret_key: keys.secretKey,
        customer_mobile: userMobile,
        amount: amount.toFixed(2),
        order_id: orderId,
        redirect_url: redirectUrl,
        note: "Add money",
      }),
      cache: "no-store",
    });

    const responseText = await spacepayResponse.text();
    const responseData = parseJsonRecord(responseText);
    const result = asRecord(responseData.result ?? responseData.data);

    const statusOk =
      isTruthyStatus(responseData.status) || isTruthyStatus(result.status);

    const paymentUrl = pickString(
      result.payment_url,
      result.paymentUrl,
      result.payment_link,
      result.paymentLink,
      result.checkout_url,
      result.checkoutUrl,
      result.link,
      responseData.payment_url,
      responseData.paymentUrl,
      responseData.payment_link,
      responseData.paymentLink,
      responseData.checkout_url,
      responseData.checkoutUrl,
      responseData.link
    );

    const providerOrderId =
      pickString(
        result.orderId,
        result.order_id,
        result.ORDERID,
        responseData.orderId,
        responseData.order_id,
        responseData.ORDERID
      ) || orderId;

    if (!spacepayResponse.ok || !statusOk || !paymentUrl) {
      const providerMessage = pickString(
        responseData.message,
        responseData.error,
        result.message,
        result.error
      );
      const message =
        providerMessage ||
        (responseText.trim()
          ? responseText.trim().slice(0, 240)
          : !paymentUrl && statusOk
          ? "Spacepay response did not include a payment URL"
          : "Unable to create Spacepay order");

      const normalizedMessage =
        message.toLowerCase().includes("insufficient balance")
          ? "Spacepay merchant account has insufficient balance. Recharge Spacepay dashboard and retry."
          : message;

      return NextResponse.json(
        {
          error: normalizedMessage,
          providerStatusCode: spacepayResponse.status,
          providerResponseStatus: responseData.status ?? null,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Payment order created",
      orderId: providerOrderId,
      paymentUrl,
      amount,
    });
  } catch (error: unknown) {
    console.error("Spacepay create order error:", error);
    return NextResponse.json(
      { error: "Unable to connect to payment provider" },
      { status: 502 }
    );
  }
}

// PUT /api/wallet — verify Spacepay order status and settle wallet if paid
export async function PUT(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = getSpacepayKeys();
  if (!keys) {
    return NextResponse.json(
      { error: "Spacepay is not configured on server" },
      { status: 500 }
    );
  }

  let payload: { orderId?: unknown };
  try {
    payload = (await request.json()) as { orderId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const inputOrderId = String(payload.orderId ?? "").trim();
  if (!inputOrderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const userMobile = await getUserMobile(user.id);
  if (!userMobile || userMobile.length !== 10) {
    return NextResponse.json(
      { error: "Valid 10-digit mobile number is required for payment" },
      { status: 400 }
    );
  }

  try {
    const spacepayResponse = await fetch(SPACEPAY_STATUS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_key: keys.publicKey,
        secret_key: keys.secretKey,
        order_id: inputOrderId,
      }),
      cache: "no-store",
    });

    const responseText = await spacepayResponse.text();
    const responseData = parseJsonRecord(responseText);
    const result = asRecord(responseData.result ?? responseData.data);
    const statusOk =
      isTruthyStatus(responseData.status) || isTruthyStatus(result.status);

    if (!spacepayResponse.ok || !statusOk) {
      const message =
        pickString(
          responseData.message,
          responseData.error,
          result.message,
          result.error
        ) ||
        (responseText.trim()
          ? responseText.trim().slice(0, 240)
          : "Unable to fetch payment status");
      return NextResponse.json(
        {
          error: message,
          providerStatusCode: spacepayResponse.status,
          providerResponseStatus: responseData.status ?? null,
        },
        { status: 502 }
      );
    }

    const orderDetails = asRecord(
      responseData.order_details ?? result.order_details ?? result.orderDetails
    );
    const providerOrderId =
      pickString(
        orderDetails.ORDERID,
        orderDetails.orderId,
        orderDetails.order_id,
        result.orderId,
        result.order_id
      ) || inputOrderId;
    const providerStatus = normalizeStatus(
      orderDetails.STATUS ??
        orderDetails.status ??
        orderDetails.payment_status ??
        result.order_status ??
        result.payment_status
    );
    const providerAmount = parsePositiveAmount(
      orderDetails.AMOUNT ?? orderDetails.amount
    );
    const providerMobile = normalizeMobile(
      orderDetails.CUSTOMER_MOBILE ?? orderDetails.customer_mobile
    );

    if (providerMobile && providerMobile !== userMobile) {
      return NextResponse.json(
        { error: "Order does not belong to current user" },
        { status: 403 }
      );
    }

    const [existingCredits] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wallet_transactions WHERE user_id = ? AND reference_id = ? AND type = 'credit' LIMIT 1",
      [user.id, providerOrderId]
    );

    if (
      existingCredits.length === 0 &&
      SPACEPAY_SUCCESS_STATUSES.has(providerStatus)
    ) {
      if (!providerAmount) {
        return NextResponse.json(
          { error: "Paid order amount is invalid" },
          { status: 502 }
        );
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          "INSERT INTO wallets (user_id, balance) VALUES (?, 0) ON DUPLICATE KEY UPDATE balance = balance",
          [user.id]
        );

        const [lockedCredits] = await connection.query<RowDataPacket[]>(
          "SELECT id FROM wallet_transactions WHERE user_id = ? AND reference_id = ? AND type = 'credit' LIMIT 1 FOR UPDATE",
          [user.id, providerOrderId]
        );

        if (lockedCredits.length === 0) {
          await connection.query(
            "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
            [providerAmount, user.id]
          );

          await connection.query(
            "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', ?, ?)",
            [
              user.id,
              providerAmount,
              "Wallet top-up via Spacepay",
              providerOrderId,
            ]
          );
        }

        await connection.commit();
      } catch (error: unknown) {
        await connection.rollback();
        console.error("Wallet settlement error:", error);
        return NextResponse.json(
          { error: "Failed to settle wallet payment" },
          { status: 500 }
        );
      } finally {
        connection.release();
      }
    }

    const [creditRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wallet_transactions WHERE user_id = ? AND reference_id = ? AND type = 'credit' LIMIT 1",
      [user.id, providerOrderId]
    );
    const credited = creditRows.length > 0;
    const balance = await getWalletBalance(user.id);

    if (credited) {
      return NextResponse.json({
        message:
          providerStatus === "PENDING"
            ? "Payment already processed"
            : "Wallet credited successfully",
        status: providerStatus || "SUCCESS",
        credited: true,
        orderId: providerOrderId,
        amount: providerAmount,
        balance,
      });
    }

    if (providerStatus === "PENDING") {
      return NextResponse.json({
        message: "Payment is pending. Please check status again in a few seconds.",
        status: "PENDING",
        credited: false,
        orderId: providerOrderId,
        amount: providerAmount,
        balance,
      });
    }

    return NextResponse.json({
      message:
        providerStatus && providerStatus !== "UNKNOWN"
          ? `Payment status: ${providerStatus}`
          : "Unable to confirm payment status",
      status: providerStatus || "UNKNOWN",
      credited: false,
      orderId: providerOrderId,
      amount: providerAmount,
      balance,
    });
  } catch (error: unknown) {
    console.error("Spacepay status check error:", error);
    return NextResponse.json(
      { error: "Unable to verify payment status" },
      { status: 502 }
    );
  }
}
