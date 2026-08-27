"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });
  }

  function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount));
  }

  if (loading) {
    return <DashboardLayout role="customer"><div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading profile...</div></div></DashboardLayout>;
  }

  const profile = data?.profile;
  const accounts = data?.accounts || [];

  return (
    <DashboardLayout role="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

        {profile && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="space-y-4">
                {[
                  ["Customer ID", profile.customer.customerId],
                  ["Full Name", profile.customer.fullName],
                  ["Date of Birth", formatDate(profile.customer.dateOfBirth)],
                  ["Email", profile.customer.email],
                  ["Phone", profile.customer.phone],
                  ["Address", profile.customer.address],
                  ["Username", profile.user.username],
                  ["Member Since", formatDate(profile.customer.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Summary</h2>
              <div className="space-y-4">
                {accounts.map((acc: any) => (
                  <div key={acc.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{acc.accountNumber}</p>
                        <p className="text-sm text-gray-500 capitalize">{acc.accountType.replace("_", " ")}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        acc.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {acc.status}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(acc.balance)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
