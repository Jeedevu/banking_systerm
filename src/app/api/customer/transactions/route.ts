import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAccountTransactions, getCustomerAccounts } from "@/lib/banking";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { inArray, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("customer");
    const { searchParams } = new URL(request.url);

    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If specific account, get transactions for that account
    if (accountId) {
      const result = await getAccountTransactions(parseInt(accountId), {
        type,
        search,
        dateFrom,
        dateTo,
        limit,
        offset,
      });
      return NextResponse.json(result);
    }

    // Otherwise get transactions for all customer accounts
    const customerAccounts = await getCustomerAccounts(session.customerId!);
    const accountIds = customerAccounts.map((a: { id: number }) => a.id);

    if (accountIds.length === 0) {
      return NextResponse.json({ transactions: [], total: 0, limit, offset });
    }

    // Get all transactions across customer accounts
    const txns = await db
      .select()
      .from(transactions)
      .where(inArray(transactions.accountId, accountIds))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      transactions: txns,
      total: txns.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load transactions";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
