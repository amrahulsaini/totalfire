import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";
import {
  cashfree,
  getCashfreeErrorMessage,
  isCashfreeConfigured,
  mapCashfreeOrderStatusToWalletStatus,
  mapCashfreePaymentStatusToWalletStatus,
} from "@/lib/cashfree";

type WalletPaymentRow = RowDataPacket & {
  amount: number | string;
  credited_to_wallet: number;
  gateway_order_id: string;
  gateway_payment_id: string | null;
  id: number;
  raw_payload: string | null;
  status: string;
  user_id: number;
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

async function getWalletBalance(userId: number) {
  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (wallets.length === 0) {
    return 0;
  }

  return Number(wallets[0].balance);
}

function findSuccessfulPayment(payments: unknown[]) {
  return payments.find((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const paymentStatus =
      "payment_status" in item ? String(item.payment_status ?? "") : "";

    return ["SUCCESS", "CAPTURED", "AUTHORIZED"].includes(
      paymentStatus.trim().toUpperCase()
    );
  }) as
    | {
        cf_payment_id?: string | number;
        payment_amount?: string | number;
        payment_status?: string;
      }
    | undefined;
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
  const cashfreeOrderId =
    payload.order_id?.toString() ?? payload.orderId?.toString() ?? payload.Cashfree_order_id?.toString() ?? "";

  if (!cashfreeOrderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const [walletPayments] = await pool.query<WalletPaymentRow[]>(
      `SELECT id, user_id, gateway_order_id, gateway_payment_id, amount, status,
              credited_to_wallet, raw_payload
       FROM wallet_payment_transactions
       WHERE gateway_order_id = ?
       LIMIT 1`,
      [cashfreeOrderId]
    );

    if (walletPayments.length === 0) {
      return NextResponse.json({ error: "Wallet order not found" }, { status: 404 });
    }

    const walletPayment = walletPayments[0];

    if (walletPayment.user_id !== user.id) {
      return NextResponse.json(
        { error: "This wallet order belongs to another user" },
        { status: 403 }
      );
    }

    if (Number(walletPayment.credited_to_wallet) === 1) {
      const balance = await getWalletBalance(user.id);
      return NextResponse.json({
        message: "Payment already verified",
        status: "SUCCESS",
        credited: true,
        orderId: cashfreeOrderId,
        paymentId: walletPayment.gateway_payment_id,
        balance,
      });
    }

    const orderResponse = await cashfree.PGFetchOrder(cashfreeOrderId);
    const orderStatus = String(orderResponse.data.order_status ?? "")
      .trim()
      .toUpperCase();

    if (orderStatus !== "PAID") {
      const mappedStatus = mapCashfreeOrderStatusToWalletStatus(orderStatus);
      await pool.query(
        `UPDATE wallet_payment_transactions
         SET status = ?, notes = ?, raw_payload = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          mappedStatus,
          orderStatus ? `Cashfree order status ${orderStatus}` : "Cashfree order pending",
          JSON.stringify({ order: orderResponse.data }),
          walletPayment.id,
        ]
      );

      if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(orderStatus)) {
        return NextResponse.json(
          {
            error: `Payment status is ${orderStatus}. Please create a fresh wallet top-up order.`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Payment not completed yet or is still processing. Please try again in a few seconds.",
          status: orderStatus || "ACTIVE",
        },
        { status: 202 }
      );
    }

    const paymentsResponse = await cashfree.PGOrderFetchPayments(cashfreeOrderId);
    const paymentsList = Array.isArray(paymentsResponse.data)
      ? paymentsResponse.data
      : [];
    const completedPayment = findSuccessfulPayment(paymentsList) ?? paymentsList[0];

    if (!completedPayment || typeof completedPayment !== "object") {
      return NextResponse.json(
        { error: "Could not retrieve the Cashfree payment details for this order." },
        { status: 502 }
      );
    }

    const paymentStatus = String(completedPayment.payment_status ?? "")
      .trim()
      .toUpperCase();
    const paymentId =
      completedPayment.cf_payment_id?.toString().trim() ||
      walletPayment.gateway_payment_id ||
      cashfreeOrderId;
    const amountDeposited =
      parseAmount(completedPayment.payment_amount) ??
      parseAmount(orderResponse.data.order_amount) ??
      parseAmount(walletPayment.amount);

    if (!amountDeposited) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    let creditedNow = false;
    try {
      await connection.beginTransaction();

      const [lockedPayments] = await connection.query<WalletPaymentRow[]>(
        `SELECT id, user_id, gateway_order_id, gateway_payment_id, amount, status,
                credited_to_wallet, raw_payload
         FROM wallet_payment_transactions
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [walletPayment.id]
      );

      if (lockedPayments.length === 0) {
        throw new Error("Wallet payment row disappeared during verification");
      }

      const lockedPayment = lockedPayments[0];

      if (Number(lockedPayment.credited_to_wallet) === 0) {
        await connection.query(
          `INSERT INTO wallets (user_id, balance)
           VALUES (?, 0)
           ON DUPLICATE KEY UPDATE balance = balance`,
          [user.id]
        );

        await connection.query(
          "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
          [amountDeposited, user.id]
        );
        await connection.query(
          `INSERT INTO wallet_transactions (
            user_id,
            amount,
            type,
            description,
            reference_id
          ) VALUES (?, ?, 'credit', 'Cashfree Wallet Top-up', ?)`,
          [user.id, amountDeposited, paymentId]
        );
        creditedNow = true;
      }

      await connection.query(
        `UPDATE wallet_payment_transactions
         SET gateway_payment_id = ?,
             gateway_signature = ?,
             status = ?,
             credited_to_wallet = 1,
             credited_at = CURRENT_TIMESTAMP,
             notes = ?,
             raw_payload = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          paymentId,
          payload.Cashfree_signature?.toString() ?? null,
          mapCashfreePaymentStatusToWalletStatus(paymentStatus || orderStatus),
          `Cashfree payment ${paymentStatus || "SUCCESS"} verified`,
          JSON.stringify({
            order: orderResponse.data,
            payments: paymentsList,
            verificationPayload: payload,
          }),
          walletPayment.id,
        ]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Wallet settlement error:", error);
      return NextResponse.json(
        { error: "Failed to settle wallet payment" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }

    if (creditedNow) {
      await createUserNotification({
        userId: user.id,
        type: "wallet",
        title: "Wallet Top-up Successful",
        message: `INR ${amountDeposited.toFixed(2)} was added to your wallet successfully.`,
        payload: {
          amount: amountDeposited,
          paymentId,
          orderId: cashfreeOrderId,
        },
      }).catch((error) => {
        console.error("Wallet notification error:", error);
      });
    }

    const balance = await getWalletBalance(user.id);

    return NextResponse.json({
      message: creditedNow ? "Payment verified successfully" : "Payment already verified",
      status: "SUCCESS",
      credited: true,
      orderId: cashfreeOrderId,
      paymentId,
      balance,
    });
  } catch (error) {
    console.error("Cashfree verification error:", error);
    return NextResponse.json(
      { error: getCashfreeErrorMessage(error, "Failed to verify payment") },
      { status: 502 }
    );
  }
}
