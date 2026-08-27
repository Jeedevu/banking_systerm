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

interface Transaction {
  transactionId: string;
  transactionType: string;
  amount: string;
  balanceAfter: string;
  createdAt: string;
  description: string | null;
}

export default function CustomerDashboard() {
  const [data, setData] = useState<{
    accounts: Account[];
    totalBalance: string;
    totalTransactions: number;
    recentTransactions: Transaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (loading) {
    return (
      <DashboardLayout role="customer">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-blue-500">
            <p className="text-sm text-gray-500 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(data?.totalBalance || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-green-500">
            <p className="text-sm text-gray-500 mb-1">Active Accounts</p>
            <p className="text-2xl font-bold text-gray-800">{data?.accounts.filter(a => a.status === "active").length || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-purple-500">
            <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800">{data?.totalTransactions || 0}</p>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Your Accounts</h2>
          </div>
          <div className="p-6">
            {data?.accounts.length === 0 ? (
              <p className="text-gray-500">No accounts found.</p>
            ) : (
              <div className="space-y-4">
                {data?.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{account.accountNumber}</p>
                      <p className="text-sm text-gray-500 capitalize">{account.accountType.replace("_", " ")} Account</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-800">{formatCurrency(account.balance)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        account.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <a href="/transactions" className="text-sm text-blue-600 hover:underline">View All</a>
          </div>
          <div className="overflow-x-auto">
            {data?.recentTransactions.length === 0 ? (
              <p className="p-6 text-gray-500">No transactions yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Balance After</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.recentTransactions.map((txn) => (
                    <tr key={txn.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-mono text-gray-700">{txn.transactionId}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(txn.transactionType)}`}>
                          {getTypeLabel(txn.transactionType)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">{formatCurrency(txn.amount)}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{formatCurrency(txn.balanceAfter)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(txn.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
