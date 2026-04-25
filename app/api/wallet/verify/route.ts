import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { getCashfreeErrorMessage, isCashfreeConfigured } from "@/lib/cashfree";
import { settleCashfreeWalletOrder } from "@/lib/cashfree-wallet";

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
    payload.order_id?.toString() ??
    payload.orderId?.toString() ??
    payload.Cashfree_order_id?.toString() ??
    "";

  if (!cashfreeOrderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const result = await settleCashfreeWalletOrder({
      orderId: cashfreeOrderId,
      expectedUserId: user.id,
      verificationPayload: payload,
      gatewaySignature: payload.Cashfree_signature?.toString() ?? null,
    });

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        status: result.status,
        credited: result.credited,
        orderId: result.orderId,
        paymentId: result.paymentId,
        balance: result.balance,
      });
    }

    if (result.status === "FORBIDDEN") {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }

    if (result.status === "NOT_FOUND") {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    if (result.status === "INVALID" || result.status === "INVALID_AMOUNT") {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    if (
      ["ACTIVE", "PENDING", "NOT_ATTEMPTED"].includes(result.status) ||
      result.message.toLowerCase().includes("processing")
    ) {
      return NextResponse.json(
        {
          error: result.message,
          status: result.status,
        },
        { status: 202 }
      );
    }

    if (
      [
        "FAILED",
        "CANCELLED",
        "USER_DROPPED",
        "EXPIRED",
        "TERMINATED",
        "TERMINATION_REQUESTED",
      ].includes(result.status)
    ) {
      return NextResponse.json(
        {
          error: result.message,
          status: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: result.message,
        status: result.status,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Cashfree verification error:", error);
    return NextResponse.json(
      { error: getCashfreeErrorMessage(error, "Failed to verify payment") },
      { status: 502 }
    );
  }
}
