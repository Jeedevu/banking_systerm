import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { withdraw } from "@/lib/banking";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("customer");
    const body = await request.json();
    const { accountId, amount, description } = body;

    if (!accountId || amount === undefined || amount === null || amount === "") {
      return NextResponse.json(
        { error: "Account ID and amount are required" },
        { status: 400 }
      );
    }

    const result = await withdraw(accountId, amount, description, session.customerId);
    return NextResponse.json({
      message: "Withdrawal successful",
      newBalance: result.account.balance,
      transaction: result.transaction,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("Insufficient") || message.includes("must be greater") || message.includes("not found") || message.includes("inactive")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
