"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <span className="text-sm text-gray-500">{total} customer(s)</span>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            <button onClick={loadCustomers} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : customers.length === 0 ? (
            <p className="p-6 text-gray-500">No customers found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-6 py-3">Customer ID</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((item: any) => (
                  <tr key={item.customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-mono text-blue-600">{item.customer.customerId}</td>
                    <td className="px-6 py-3 text-sm text-gray-800 font-medium">{item.customer.fullName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.customer.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.customer.phone}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.user.username}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(item.customer.createdAt)}</td>
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
