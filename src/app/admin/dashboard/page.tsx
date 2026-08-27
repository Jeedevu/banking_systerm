"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return <DashboardLayout role="admin"><div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading admin dashboard...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-blue-500">
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-800">{data?.totalCustomers || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-green-500">
            <p className="text-sm text-gray-500 mb-1">Total Accounts</p>
            <p className="text-3xl font-bold text-gray-800">{data?.totalAccounts || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{data?.activeAccounts || 0} active</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-purple-500">
            <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-800">{data?.totalTransactions || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm card-hover border-l-4 border-l-orange-500">
            <p className="text-sm text-gray-500 mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(data?.totalBalance || 0)}</p>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        {data?.typeBreakdown?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.typeBreakdown.map((item: any) => (
                <div key={item.type} className="p-4 bg-gray-50 rounded-lg text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getTypeColor(item.type)}`}>
                    {item.type.replace("_", " ")}
                  </span>
                  <p className="text-lg font-bold text-gray-800">{item.total}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.totalAmount || 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <a href="/admin/transactions" className="text-sm text-blue-600 hover:underline">View All</a>
          </div>
          <div className="overflow-x-auto">
            {data?.recentTransactions?.length === 0 ? (
              <p className="p-6 text-gray-500">No transactions yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.recentTransactions?.map((item: any) => (
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
                      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(item.transaction.createdAt)}</td>
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
