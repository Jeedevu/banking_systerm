import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getCustomerDashboardStats } from "@/lib/banking";

export async function GET() {
  try {
    const session = await requireRole("customer");
    const stats = await getCustomerDashboardStats(session.customerId!);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
