import CashfreeCheckoutClient from "./CashfreeCheckoutClient";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CashfreeCheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const orderId = getSingleQueryValue(params.order_id).trim();
  const paymentSessionId = getSingleQueryValue(
    params.payment_session_id
  ).trim();
  const mode =
    getSingleQueryValue(params.environment).trim().toLowerCase() === "sandbox"
      ? "sandbox"
      : "production";

  return (
    <CashfreeCheckoutClient
      orderId={orderId}
      paymentSessionId={paymentSessionId}
      mode={mode}
    />
  );
}
