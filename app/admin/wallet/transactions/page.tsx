"use client";
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

  useEffect(() => {
    const token = window.localStorage.getItem("adminToken") ?? "";
    fetch("/api/admin/wallet/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.transactions);
      });
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">All User Transactions</h1>
      <table className="w-full text-left bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-4">User</th>
            <th className="p-4">Email</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Type</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="p-4">{tx.full_name}</td>
              <td className="p-4 text-sm text-gray-500">{tx.email}</td>
              <td className="p-4">INR {tx.amount}</td>
              <td className={`p-4 font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>{tx.type.toUpperCase()}</td>
              <td className="p-4 text-sm text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
