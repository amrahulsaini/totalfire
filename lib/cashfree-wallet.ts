import pool from "@/lib/db";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";
import {
  cashfree,
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

type SettleCashfreeWalletOrderInput = {
  orderId: string;
  expectedUserId?: number;
  verificationPayload?: unknown;
  gatewaySignature?: string | null;
};

export type SettleCashfreeWalletOrderResult = {
  balance?: number;
  credited: boolean;
  message: string;
  orderId: string;
  paymentId: string | null;
  status: string;
  success: boolean;
  userId?: number;
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

function readWebhookPaymentStatus(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = payload as {
    data?: { payment?: { payment_status?: string | number } };
    payment?: { payment_status?: string | number };
  };

  return (
    value.data?.payment?.payment_status?.toString().trim().toUpperCase() ||
    value.payment?.payment_status?.toString().trim().toUpperCase() ||
    ""
  );
}

export async function settleCashfreeWalletOrder(
  input: SettleCashfreeWalletOrderInput
): Promise<SettleCashfreeWalletOrderResult> {
  const cashfreeOrderId = input.orderId.trim();
  if (!cashfreeOrderId) {
    return {
      credited: false,
      message: "Missing orderId",
      orderId: "",
      paymentId: null,
      status: "INVALID",
      success: false,
    };
  }

  const [walletPayments] = await pool.query<WalletPaymentRow[]>(
    `SELECT id, user_id, gateway_order_id, gateway_payment_id, amount, status,
            credited_to_wallet, raw_payload
     FROM wallet_payment_transactions
     WHERE gateway_order_id = ?
     LIMIT 1`,
    [cashfreeOrderId]
  );

  if (walletPayments.length === 0) {
    return {
      credited: false,
      message: "Wallet order not found",
      orderId: cashfreeOrderId,
      paymentId: null,
      status: "NOT_FOUND",
      success: false,
    };
  }

  const walletPayment = walletPayments[0];

  if (
    typeof input.expectedUserId === "number" &&
    walletPayment.user_id !== input.expectedUserId
  ) {
    return {
      credited: false,
      message: "This wallet order belongs to another user",
      orderId: cashfreeOrderId,
      paymentId: walletPayment.gateway_payment_id,
      status: "FORBIDDEN",
      success: false,
      userId: walletPayment.user_id,
    };
  }

  if (Number(walletPayment.credited_to_wallet) === 1) {
    const balance = await getWalletBalance(walletPayment.user_id);
    return {
      balance,
      credited: true,
      message: "Payment already verified",
      orderId: cashfreeOrderId,
      paymentId: walletPayment.gateway_payment_id,
      status: "SUCCESS",
      success: true,
      userId: walletPayment.user_id,
    };
  }

  const orderResponse = await cashfree.PGFetchOrder(cashfreeOrderId);
  const orderStatus = String(orderResponse.data.order_status ?? "")
    .trim()
    .toUpperCase();
  const webhookPaymentStatus = readWebhookPaymentStatus(input.verificationPayload);

  if (orderStatus !== "PAID") {
    const effectiveStatus = webhookPaymentStatus || orderStatus || "ACTIVE";
    const mappedStatus = webhookPaymentStatus
      ? mapCashfreePaymentStatusToWalletStatus(webhookPaymentStatus)
      : mapCashfreeOrderStatusToWalletStatus(orderStatus);
    await pool.query(
      `UPDATE wallet_payment_transactions
       SET status = ?, notes = ?, raw_payload = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        mappedStatus,
        effectiveStatus
          ? `Cashfree order status ${effectiveStatus}`
          : "Cashfree order pending",
        JSON.stringify({
          order: orderResponse.data,
          verificationPayload: input.verificationPayload ?? null,
        }),
        walletPayment.id,
      ]
    );

    if (
      [
        "FAILED",
        "CANCELLED",
        "USER_DROPPED",
        "EXPIRED",
        "TERMINATED",
        "TERMINATION_REQUESTED",
      ].includes(effectiveStatus)
    ) {
      return {
        credited: false,
        message: `Payment status is ${effectiveStatus}. Please create a fresh wallet top-up order.`,
        orderId: cashfreeOrderId,
        paymentId: walletPayment.gateway_payment_id,
        status: effectiveStatus,
        success: false,
        userId: walletPayment.user_id,
      };
    }

    return {
      credited: false,
      message:
        "Payment not completed yet or is still processing. Please try again in a few seconds.",
      orderId: cashfreeOrderId,
      paymentId: walletPayment.gateway_payment_id,
      status: effectiveStatus,
      success: false,
      userId: walletPayment.user_id,
    };
  }

  const paymentsResponse = await cashfree.PGOrderFetchPayments(cashfreeOrderId);
  const paymentsList = Array.isArray(paymentsResponse.data)
    ? paymentsResponse.data
    : [];
  const completedPayment = findSuccessfulPayment(paymentsList) ?? paymentsList[0];

  if (!completedPayment || typeof completedPayment !== "object") {
    return {
      credited: false,
      message: "Could not retrieve the Cashfree payment details for this order.",
      orderId: cashfreeOrderId,
      paymentId: walletPayment.gateway_payment_id,
      status: "PAYMENT_DETAILS_MISSING",
      success: false,
      userId: walletPayment.user_id,
    };
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
    return {
      credited: false,
      message: "Invalid payment amount",
      orderId: cashfreeOrderId,
      paymentId,
      status: "INVALID_AMOUNT",
      success: false,
      userId: walletPayment.user_id,
    };
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

    if (
      typeof input.expectedUserId === "number" &&
      lockedPayment.user_id !== input.expectedUserId
    ) {
      throw new Error("Wallet order user changed during verification");
    }

    if (Number(lockedPayment.credited_to_wallet) === 0) {
      await connection.query(
        `INSERT INTO wallets (user_id, balance)
         VALUES (?, 0)
         ON DUPLICATE KEY UPDATE balance = balance`,
        [lockedPayment.user_id]
      );

      await connection.query(
        "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
        [amountDeposited, lockedPayment.user_id]
      );
      await connection.query(
        `INSERT INTO wallet_transactions (
          user_id,
          amount,
          type,
          description,
          reference_id
        ) VALUES (?, ?, 'credit', 'Cashfree Wallet Top-up', ?)`,
        [lockedPayment.user_id, amountDeposited, paymentId]
      );
      creditedNow = true;
    }

    await connection.query(
      `UPDATE wallet_payment_transactions
       SET gateway_payment_id = ?,
           gateway_signature = COALESCE(?, gateway_signature),
           status = ?,
           credited_to_wallet = 1,
           credited_at = CURRENT_TIMESTAMP,
           notes = ?,
           raw_payload = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        paymentId,
        input.gatewaySignature ?? null,
        mapCashfreePaymentStatusToWalletStatus(paymentStatus || orderStatus),
        `Cashfree payment ${paymentStatus || "SUCCESS"} verified`,
        JSON.stringify({
          order: orderResponse.data,
          payments: paymentsList,
          verificationPayload: input.verificationPayload ?? null,
        }),
        walletPayment.id,
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (creditedNow) {
    await createUserNotification({
      userId: walletPayment.user_id,
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

  const balance = await getWalletBalance(walletPayment.user_id);

  return {
    balance,
    credited: true,
    message: creditedNow ? "Payment verified successfully" : "Payment already verified",
    orderId: cashfreeOrderId,
    paymentId,
    status: "SUCCESS",
    success: true,
    userId: walletPayment.user_id,
  };
}
