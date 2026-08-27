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

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch("/api/customer/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts || []);
        if (d.accounts?.length > 0) {
          setFromAccount(String(d.accounts[0].id));
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setMessage(null);
    setLoading(true);
    setConfirming(false);

    try {
      const res = await fetch("/api/customer/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(fromAccount),
          toAccountNumber,
          amount: parseFloat(amount),
          description,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: `Transfer successful! New balance: ₹${data.newBalance}` });
      setAmount("");
      setToAccountNumber("");
      setDescription("");

      const dash = await fetch("/api/customer/dashboard").then((r) => r.json());
      setAccounts(dash.accounts || []);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  function cancelConfirm() {
    setConfirming(false);
  }

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const selectedAcc = accounts.find((a) => String(a.id) === fromAccount);

  return (
    <DashboardLayout role="customer">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Transfer Money</h1>

        {message && (
          <div className={`p-4 rounded-lg notification-enter ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {confirming && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 notification-enter">
            <p className="text-yellow-800 font-medium mb-2">⚠ Confirm Transfer</p>
            <p className="text-yellow-700 text-sm mb-3">
              Transfer ₹{parseFloat(amount).toLocaleString("en-IN")} from {selectedAcc?.accountNumber} to {toAccountNumber}?
            </p>
            <div className="flex gap-3">
              <button onClick={(e) => handleSubmit(e as any)} disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium disabled:opacity-50">
                {loading ? "Processing..." : "Confirm"}
              </button>
              <button onClick={cancelConfirm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
              <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                <option value="">Select source account</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Account Number</label>
              <input type="text" value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. ACC00000001" required />
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
                placeholder="e.g. Payment to friend" />
            </div>

            {!confirming && (
              <button type="submit" disabled={loading || !fromAccount}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50">
                Transfer
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
