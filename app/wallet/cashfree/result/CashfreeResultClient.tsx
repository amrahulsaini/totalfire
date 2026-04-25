"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function CashfreeResultClient({
  orderId,
}: {
  orderId: string;
}) {
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  const appReturnUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (orderId) {
      params.set("order_id", orderId);
    }

    const query = params.toString();
    return query
      ? `totalfire://wallet/cashfree/return?${query}`
      : "totalfire://wallet/cashfree/return";
  }, [orderId]);

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      setRedirectAttempted(true);
      window.location.href = appReturnUrl;
    }, 500);

    return () => window.clearTimeout(redirectTimer);
  }, [appReturnUrl]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-black text-emerald-300">
          OK
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          Returning to TotalFire
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          We are reopening the app now so your wallet can refresh. If the app
          does not open automatically, use the button below.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">What happens next</p>
          <p className="mt-2 leading-6 text-slate-300">
            TotalFire will verify the order when the app resumes. Even if the
            app return misses, the server webhook can still credit the wallet in
            the background.
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

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={appReturnUrl}
            className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          >
            Open TotalFire App
          </a>
          <Link
            href="/"
            className="inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Open Website
          </Link>
        </div>

        {redirectAttempted ? (
          <p className="mt-4 text-xs text-slate-400">
            Automatic app return was attempted. If you are still on this page,
            tap &quot;Open TotalFire App&quot;.
          </p>
        ) : null}
      </div>
    </div>
  );
}
