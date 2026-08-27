import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getCustomerProfile, getCustomerAccounts } from "@/lib/banking";

export async function GET() {
  try {
    const session = await requireRole("customer");
    const profile = await getCustomerProfile(session.customerId!);
    const accounts = await getCustomerAccounts(session.customerId!);
    return NextResponse.json({ profile, accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
