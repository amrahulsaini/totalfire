"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Transaction {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function AllTransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = window.localStorage.getItem("adminToken") ?? "";
    fetch("/api/admin/wallet/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.transactions ?? []);
          setMessage("");
        } else {
          setMessage(json.error || "Failed to load transactions");
        }
      })
      .catch(() => {
        setMessage("Failed to load transactions");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border bg-white px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Wallet Add-Money Transactions
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Track how much users added to wallet through payment gateway.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="outline-btn !px-4 !py-2 !text-sm">
                Back To Admin
              </Link>
              <Link href="/admin/wallet/withdrawals" className="outline-btn !px-4 !py-2 !text-sm">
                User Withdrawal Requests
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="rounded-xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "#fed7aa", background: "#fff7ed", color: "#9a3412" }}>
            {message}
          </div>
        ) : null}

        <div className="overflow-auto rounded-2xl border bg-white" style={{ borderColor: "var(--border-color)" }}>
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr style={{ background: "#fff7ed", borderBottom: "1px solid #fdba74" }}>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>User</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Email</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Amount</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Type</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Description</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                    No transactions found yet.
                  </td>
                </tr>
              ) : (
                data.map((tx) => (
                  <tr key={tx.id} style={{ borderTop: "1px solid #ffedd5" }}>
                    <td className="p-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{tx.full_name}</td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{tx.email}</td>
                    <td className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>INR {tx.amount}</td>
                    <td className={`p-4 text-xs font-bold uppercase tracking-wide ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                      {tx.type}
                    </td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{tx.description}</td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
