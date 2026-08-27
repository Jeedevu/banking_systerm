"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
}

interface Transaction {
  transactionId: string;
  transactionType: string;
  amount: string;
  balanceAfter: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAccount, setSelectedAccount] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/customer/dashboard")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [selectedAccount, typeFilter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccount) params.set("accountId", selectedAccount);
      if (typeFilter) params.set("type", typeFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/customer/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadTransactions();
  }

  function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function getTypeColor(type: string) {
    switch (type) {
      case "deposit": return "text-green-600 bg-green-50";
      case "withdrawal": return "text-red-600 bg-red-50";
      case "transfer_out": return "text-orange-600 bg-orange-50";
      case "transfer_in": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "deposit": return "Deposit";
      case "withdrawal": return "Withdrawal";
      case "transfer_out": return "Transfer Out";
      case "transfer_in": return "Transfer In";
      default: return type;
    }
  }

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Transaction History</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.accountNumber}</option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="transfer_in">Transfer In</option>
            </select>

            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <div className="flex gap-2">
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">{total} transaction(s) found</span>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="p-6 text-gray-500">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Balance After</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-mono text-gray-700">{txn.transactionId}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(txn.transactionType)}`}>
                          {getTypeLabel(txn.transactionType)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">{formatCurrency(txn.amount)}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{formatCurrency(txn.balanceAfter)}</td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-500">{txn.reference || "—"}</td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-48 truncate">{txn.description || "—"}</td>
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(txn.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
