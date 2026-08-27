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

export default function WithdrawPage() {
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
      const res = await fetch("/api/customer/withdraw", {
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

      setMessage({ type: "success", text: `Withdrawal successful! New balance: ₹${data.newBalance}` });
      setAmount("");
      setDescription("");

      const dash = await fetch("/api/customer/dashboard").then((r) => r.json());
      setAccounts(dash.accounts || []);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const selectedAcc = accounts.find((a) => String(a.id) === selectedAccount);

  return (
    <DashboardLayout role="customer">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Withdraw Money</h1>

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
                    {acc.accountNumber} — Balance: ₹{Number(acc.balance).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {selectedAcc && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                Available balance: ₹{Number(selectedAcc.balance).toLocaleString("en-IN")}
              </div>
            )}

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
                placeholder="e.g. ATM withdrawal" />
            </div>

            <button type="submit" disabled={loading || !selectedAccount}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50">
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
