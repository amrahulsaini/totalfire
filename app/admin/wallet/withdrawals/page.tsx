"use client";
import React, { useEffect, useState } from "react";

interface Withdrawal {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const [data, setData] = useState<Withdrawal[]>([]);
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
          setData(json.withdrawals);
          return;
        }
        setMessage({ type: "error", text: json.error || "Failed to load withdrawals" });
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to load withdrawals" });
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
      fetchWithdrawals();
    } else {
      setMessage({ type: "error", text: json.error || "Failed action" });
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Review Withdraw Requests</h1>
      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <table className="w-full text-left bg-white border border-gray-200 shadow-sm">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-4">User</th>
            <th className="p-4">Email</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((req) => (
            <tr key={req.id} className="border-b">
              <td className="p-4">{req.full_name}</td>
              <td className="p-4 text-sm text-gray-500">{req.email}</td>
              <td className="p-4 font-bold">INR {req.amount}</td>
              <td className={`p-4 font-bold uppercase text-xs tracking-wider ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}>
                {req.status}
              </td>
              <td className="p-4 space-x-2">
                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(req.id, "approve")}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "reject")}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
