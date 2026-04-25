import { NextResponse } from "next/server";
import {
  cashfree,
  getCashfreeErrorMessage,
  isCashfreeConfigured,
} from "@/lib/cashfree";
import { settleCashfreeWalletOrder } from "@/lib/cashfree-wallet";

function readOrderIdFromWebhookPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const webhook = payload as {
    data?: {
      order?: { order_id?: string | number };
      payment?: { order_id?: string | number };
    };
    object?: {
      data?: {
        order?: { order_id?: string | number };
        payment?: { order_id?: string | number };
      };
    };
  };

  const directOrderId =
    webhook.data?.order?.order_id?.toString().trim() ||
    webhook.data?.payment?.order_id?.toString().trim();
  if (directOrderId) {
    return directOrderId;
  }

  return (
    webhook.object?.data?.order?.order_id?.toString().trim() ||
    webhook.object?.data?.payment?.order_id?.toString().trim() ||
    ""
  );
}

export async function POST(request: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: "Cashfree is not configured on server" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-webhook-signature")?.trim() ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp")?.trim() ?? "";
  const rawBody = await request.text();

  if (!signature || !timestamp || !rawBody.trim()) {
    return NextResponse.json(
      { error: "Missing webhook signature, timestamp, or payload" },
      { status: 400 }
    );
  }

  try {
    const verifiedEvent = cashfree.PGVerifyWebhookSignature(
      signature,
      rawBody,
      timestamp
    );
    const payload =
      verifiedEvent?.object && typeof verifiedEvent.object === "object"
        ? verifiedEvent.object
        : JSON.parse(rawBody);
    const orderId = readOrderIdFromWebhookPayload(payload);

    if (!orderId) {
      return NextResponse.json({
        message: "Webhook received but no order_id was present",
      });
    }

    const result = await settleCashfreeWalletOrder({
      orderId,
      verificationPayload: payload,
      gatewaySignature: signature,
    });

    return NextResponse.json({
      message: result.message,
      success: result.success,
      status: result.status,
      orderId: result.orderId,
      credited: result.credited,
      paymentId: result.paymentId,
    });
  } catch (error) {
    console.error("Cashfree webhook error:", error);
    return NextResponse.json(
      { error: getCashfreeErrorMessage(error, "Failed to process Cashfree webhook") },
      { status: 400 }
    );
  }
}
