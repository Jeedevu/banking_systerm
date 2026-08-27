import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { transfer } from "@/lib/banking";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("customer");
    const body = await request.json();
    const { accountId, toAccountNumber, amount, description } = body;

    if (!accountId || !toAccountNumber || !amount) {
      return NextResponse.json(
        { error: "Account ID, destination account number, and amount are required" },
        { status: 400 }
      );
    }

    const result = await transfer(accountId, toAccountNumber, amount, description, session.customerId);
    return NextResponse.json({
      message: "Transfer successful",
      newBalance: result.sourceAccount.balance,
      transferOut: result.transferOut,
      transferIn: result.transferIn,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    if (message.includes("Unauthorized") || message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (
      message.includes("Insufficient") ||
      message.includes("not found") ||
      message.includes("inactive") ||
      message.includes("same account") ||
      message.includes("must be greater")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
