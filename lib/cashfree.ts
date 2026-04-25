import { Cashfree, CFEnvironment } from "cashfree-pg";

export const cashfreeAppId =
  process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID || "";
export const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || "";
export const cashfreeEnvironmentName =
  process.env.CASHFREE_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
export const cashfreeEnvironment =
  cashfreeEnvironmentName === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
export const cashfreeBaseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://totalfire.in";

export const cashfree = new Cashfree(
  cashfreeEnvironment,
  cashfreeAppId,
  cashfreeSecretKey
);

export function isCashfreeConfigured() {
  return Boolean(cashfreeAppId && cashfreeSecretKey);
}

export function getCashfreeReturnUrl() {
  return `${cashfreeBaseUrl}/wallet/cashfree/result?order_id={order_id}`;
}

export function getCashfreeNotifyUrl() {
  return `${cashfreeBaseUrl}/api/cashfree/webhook`;
}

export function getCashfreeHostedCheckoutUrl({
  orderId,
  paymentSessionId,
  environment = cashfreeEnvironmentName,
}: {
  orderId: string;
  paymentSessionId: string;
  environment?: string;
}) {
  const params = new URLSearchParams({
    order_id: orderId,
    payment_session_id: paymentSessionId,
    environment,
  });

  return `${cashfreeBaseUrl}/wallet/cashfree/checkout?${params.toString()}`;
}

export function getCashfreeErrorMessage(
  error: unknown,
  fallback = "Cashfree request failed"
) {
  const responseData =
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
      ? error.response.data
      : null;

  if (responseData && typeof responseData === "object") {
    const message =
      "message" in responseData ? responseData.message : undefined;
    const code = "code" in responseData ? responseData.code : undefined;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    if (typeof code === "string" && code.trim()) {
      return code.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

export function mapCashfreeOrderStatusToWalletStatus(status: unknown) {
  switch (String(status ?? "").trim().toUpperCase()) {
    case "PAID":
      return "captured" as const;
    case "AUTHORIZED":
      return "authorized" as const;
    case "EXPIRED":
    case "TERMINATED":
    case "TERMINATION_REQUESTED":
    case "FAILED":
      return "failed" as const;
    default:
      return "created" as const;
  }
}

export function mapCashfreePaymentStatusToWalletStatus(status: unknown) {
  switch (String(status ?? "").trim().toUpperCase()) {
    case "SUCCESS":
    case "CAPTURED":
    case "PAID":
      return "captured" as const;
    case "AUTHORIZED":
      return "authorized" as const;
    case "FAILED":
    case "CANCELLED":
    case "USER_DROPPED":
      return "failed" as const;
    default:
      return "created" as const;
  }
}
