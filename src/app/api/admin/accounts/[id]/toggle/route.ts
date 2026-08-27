import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { toggleAccountStatus } from "@/lib/banking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "active" && status !== "inactive") {
      return NextResponse.json(
        { error: "Status must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    const updated = await toggleAccountStatus(accountId, status);
    return NextResponse.json({
      message: `Account ${status === "active" ? "activated" : "deactivated"} successfully`,
      account: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update account status";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
