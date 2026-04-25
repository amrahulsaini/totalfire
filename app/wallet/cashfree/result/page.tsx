import CashfreeResultClient from "./CashfreeResultClient";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CashfreeResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const orderId = getSingleQueryValue(params.order_id).trim();

  return <CashfreeResultClient orderId={orderId} />;
}
