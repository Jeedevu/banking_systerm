import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardStats } from "@/lib/banking";

export async function GET() {
  try {
    await requireRole("admin");
    const stats = await getAdminDashboardStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admin dashboard";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
