"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Withdrawal {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  amount: number;
  method?: string;
  account_details?: string;
  status: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const [data, setData] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchWithdrawals = () => {
    const token = window.localStorage.getItem("adminToken") ?? "";
    fetch("/api/admin/wallet/withdrawals", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.withdrawals ?? []);
          setMessage(null);
          return;
        }
        setMessage({ type: "error", text: json.error || "Failed to load withdrawals" });
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to load withdrawals" });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const token = window.localStorage.getItem("adminToken") ?? "";
    const res = await fetch("/api/admin/wallet/withdrawals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    if (json.success) {
      setMessage({
        type: "success",
        text: `Withdrawal ${action === "approve" ? "approved" : "rejected"} successfully`,
      });
      setLoading(true);
      fetchWithdrawals();
    } else {
      setMessage({ type: "error", text: json.error || "Failed action" });
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border bg-white px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                User Withdrawal Requests
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Review pending requests and approve or reject them from here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="outline-btn !px-4 !py-2 !text-sm"
                onClick={() => {
                  setLoading(true);
                  fetchWithdrawals();
                }}
              >
                Refresh
              </button>
              <Link href="/admin" className="outline-btn !px-4 !py-2 !text-sm">
                Back To Admin
              </Link>
              <Link href="/admin/wallet/transactions" className="outline-btn !px-4 !py-2 !text-sm">
                Wallet Add-Money Transactions
              </Link>
            </div>
          </div>
        </header>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-orange-200 bg-orange-50 text-orange-800"
          }`}
        >
          {message.text}
        </div>
      )}

        <div className="overflow-auto rounded-2xl border bg-white" style={{ borderColor: "var(--border-color)" }}>
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr style={{ background: "#fff7ed", borderBottom: "1px solid #fdba74" }}>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>User</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Email</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Amount</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Method</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Details</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Status</th>
                <th className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                    Loading withdrawal requests...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                    No withdrawal requests found yet.
                  </td>
                </tr>
              ) : (
                data.map((req) => (
                  <tr key={req.id} style={{ borderTop: "1px solid #ffedd5" }}>
                    <td className="p-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{req.full_name}</td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{req.email}</td>
                    <td className="p-4 text-sm font-bold" style={{ color: "var(--text-primary)" }}>INR {req.amount}</td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-primary)" }}>{req.method || "-"}</td>
                    <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{req.account_details || "-"}</td>
                    <td className="p-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                        style={{
                          background:
                            req.status === "approved"
                              ? "#dcfce7"
                              : req.status === "rejected"
                                ? "#fee2e2"
                                : "#ffedd5",
                          color:
                            req.status === "approved"
                              ? "#166534"
                              : req.status === "rejected"
                                ? "#991b1b"
                                : "#9a3412",
                        }}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAction(req.id, "approve")}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "reject")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                          Action completed
                        </span>
                      )}
                    </td>
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
