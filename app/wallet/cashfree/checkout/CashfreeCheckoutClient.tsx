"use client";

import { useEffect, useRef, useState } from "react";

type CashfreeMode = "production" | "sandbox";

type CashfreeFactoryOptions = {
  mode: CashfreeMode;
};

type CashfreeCheckoutOptions = {
  paymentSessionId: string;
  redirectTarget: "_self";
};

type CashfreeInstance = {
  checkout: (
    options: CashfreeCheckoutOptions
  ) => Promise<unknown> | unknown;
};

declare global {
  interface Window {
    Cashfree?: (options: CashfreeFactoryOptions) => CashfreeInstance;
  }
}

const CASHFREE_SCRIPT_ID = "cashfree-web-sdk";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Cashfree checkout could not be opened.";
}

function loadCashfreeScript() {
  return new Promise<(options: CashfreeFactoryOptions) => CashfreeInstance>(
    (resolve, reject) => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
        return;
      }

      const existingScript = document.getElementById(
        CASHFREE_SCRIPT_ID
      ) as HTMLScriptElement | null;

      const handleLoad = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree);
          return;
        }

        reject(new Error("Cashfree SDK loaded but was not initialized."));
      };

      const handleError = () => {
        reject(new Error("Cashfree SDK could not be downloaded."));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = CASHFREE_SCRIPT_ID;
      script.async = true;
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
    }
  );
}

export default function CashfreeCheckoutClient({
  orderId,
  paymentSessionId,
  mode,
}: {
  orderId: string;
  paymentSessionId: string;
  mode: CashfreeMode;
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLaunching, setIsLaunching] = useState(true);
  const launchAttemptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function openCheckout() {
      if (launchAttemptedRef.current) {
        return;
      }

      launchAttemptedRef.current = true;

      if (!orderId || !paymentSessionId) {
        setErrorMessage("Missing Cashfree order details.");
        setIsLaunching(false);
        return;
      }

      try {
        const cashfreeFactory = await loadCashfreeScript();

        if (cancelled) {
          return;
        }

        const cashfree = cashfreeFactory({ mode });
        await Promise.resolve(
          cashfree.checkout({
            paymentSessionId,
            redirectTarget: "_self",
          })
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
        setIsLaunching(false);
      }
    }

    void openCheckout();

    return () => {
      cancelled = true;
    };
  }, [mode, orderId, paymentSessionId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-black text-emerald-300">
          Rs
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          Redirecting to Cashfree
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your secure wallet top-up checkout is opening now. If payment
          finishes successfully, return to the TotalFire app to complete wallet
          verification.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Order ID</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-300">
            {orderId || "Unavailable"}
          </p>
        </div>

        {isLaunching ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-emerald-200/40 border-t-emerald-200" />
            Opening the secure payment page...
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            <p className="font-semibold">Checkout could not be opened</p>
            <p className="mt-1 leading-6 text-rose-100/90">
              {errorMessage || "Please reload this page and try again."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-400"
            >
              Retry Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
