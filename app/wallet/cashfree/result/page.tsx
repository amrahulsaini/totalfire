import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-black text-emerald-300">
          OK
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          Payment flow submitted
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Return to the TotalFire app now. Your wallet top-up will be verified
          there, and if the payment succeeded the balance will update
          automatically.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">What to do next</p>
          <p className="mt-2 leading-6 text-slate-300">
            Open the app again. If the wallet balance does not update
            immediately, tap the Verify Payment button inside the wallet screen.
          </p>
        </div>

        {orderId ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Order ID</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-300">
              {orderId}
            </p>
          </div>
        ) : null}

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
        >
          Open TotalFire Website
        </Link>
      </div>
    </div>
  );
}
