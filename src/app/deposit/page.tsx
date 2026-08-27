"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: string;
  status: string;
}

export default function DepositPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customer/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts || []);
        if (d.accounts?.length > 0) {
          setSelectedAccount(String(d.accounts[0].id));
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/customer/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(selectedAccount),
          amount: parseFloat(amount),
          description,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: `Deposit successful! New balance: ₹${data.newBalance}` });
      setAmount("");
      setDescription("");

      // Refresh accounts
      const dash = await fetch("/api/customer/dashboard").then((r) => r.json());
      setAccounts(dash.accounts || []);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  const activeAccounts = accounts.filter((a) => a.status === "active");

  return (
    <DashboardLayout role="customer">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Deposit Money</h1>

        {message && (
          <div className={`p-4 rounded-lg notification-enter ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Account</label>
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                <option value="">Choose account</option>
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} — {acc.accountType.replace("_", " ")} (₹{Number(acc.balance).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter amount" min="0.01" step="0.01" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Cash deposit" />
            </div>

            <button type="submit" disabled={loading || !selectedAccount}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50">
              {loading ? "Processing..." : "Deposit"}
            </button>
          </form>
        </div>

        {activeAccounts.length === 0 && (
          <p className="text-center text-gray-500">No active accounts available for deposit.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
