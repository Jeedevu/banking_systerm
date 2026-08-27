"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (accountNumber) params.set("accountNumber", accountNumber);

      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount || 0));
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

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">All Transactions</h1>
          <span className="text-sm text-gray-500">{total} transaction(s)</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="transfer_in">Transfer In</option>
            </select>

            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account No." className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />

            <button onClick={loadTransactions} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="p-6 text-gray-500">No transactions found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Balance After</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((item: any) => (
                  <tr key={item.transaction.transactionId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-700">{item.transaction.transactionId}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.account.accountNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.customer.fullName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(item.transaction.transactionType)}`}>
                        {item.transaction.transactionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{formatCurrency(item.transaction.amount)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatCurrency(item.transaction.balanceAfter)}</td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-500">{item.transaction.reference || "—"}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(item.transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
