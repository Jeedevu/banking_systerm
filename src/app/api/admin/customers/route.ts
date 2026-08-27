import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { adminGetCustomers } from "@/lib/banking";

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);

    const result = await adminGetCustomers({
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load customers";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
