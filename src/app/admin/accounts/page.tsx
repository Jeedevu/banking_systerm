"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/accounts?${params}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(accountId: number, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this account?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${accountId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: data.message });
      loadAccounts();
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount || 0));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Accounts</h1>
          <span className="text-sm text-gray-500">{total} account(s)</span>
        </div>

        {message && (
          <div className={`p-4 rounded-lg notification-enter ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account number or customer..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={loadAccounts} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : accounts.length === 0 ? (
            <p className="p-6 text-gray-500">No accounts found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-6 py-3">Account No.</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Balance</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((item: any) => (
                  <tr key={item.account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-mono text-blue-600">{item.account.accountNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{item.customer.fullName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{item.account.accountType.replace("_", " ")}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{formatCurrency(item.account.balance)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.account.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {item.account.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(item.account.createdAt)}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleStatus(item.account.id, item.account.status)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          item.account.status === "active"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {item.account.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
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
