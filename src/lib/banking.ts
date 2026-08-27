import { db } from "@/db";
import { users, customers, accounts, transactions } from "@/db/schema";
import { eq, and, desc, like, gte, lte, sql, count, sum } from "drizzle-orm";
import { Decimal } from "decimal.js";

// ─── Helper: Generate Transaction ID ──────────────────────────────
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
}

// ─── Helper: Validate Amount ──────────────────────────────────────
function validateAmount(amount: string | number): Decimal {
  const dec = new Decimal(String(amount));
  if (dec.lte(0)) {
    throw new Error("Amount must be greater than zero");
  }
  if (dec.gt(new Decimal("999999999999.99"))) {
    throw new Error("Amount exceeds maximum allowed value");
  }
  // Check decimal places
  if (dec.decimalPlaces() > 2) {
    throw new Error("Amount cannot have more than 2 decimal places");
  }
  return dec;
}

// ─── Get Account by ID (with ownership check) ────────────────────
export async function getAccountById(accountId: number, customerId?: number) {
  const conditions = [eq(accounts.id, accountId)];
  if (customerId) {
    conditions.push(eq(accounts.customerIdFk, customerId));
  }

  const result = await db
    .select({
      account: accounts,
      customer: customers,
    })
    .from(accounts)
    .innerJoin(customers, eq(accounts.customerIdFk, customers.id))
    .where(and(...conditions))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Account not found");
  }

  return result[0];
}

// ─── Get Customer Accounts ────────────────────────────────────────
export async function getCustomerAccounts(customerDbId: number) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.customerIdFk, customerDbId))
    .orderBy(desc(accounts.createdAt));
}

// ─── DEPOSIT ──────────────────────────────────────────────────────
export async function deposit(
  accountId: number,
  amount: string | number,
  description?: string,
  customerId?: number
) {
  const decAmount = validateAmount(amount);

  // Get and validate account
  const { account } = await getAccountById(accountId, customerId);

  if (account.status !== "active") {
    throw new Error("Cannot deposit to an inactive account");
  }

  const currentBalance = new Decimal(account.balance);
  const newBalance = currentBalance.plus(decAmount);

  // Use database transaction for atomicity
  const result = await db.transaction(async (tx: any) => {
    // Update account balance
    const [updatedAccount] = await tx
      .update(accounts)
      .set({
        balance: newBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning();

    // Create transaction record
    const txnId = generateTransactionId();
    const [txn] = await tx
      .insert(transactions)
      .values({
        transactionId: txnId,
        accountId,
        transactionType: "deposit",
        amount: decAmount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        description: description || "Cash deposit",
      })
      .returning();

    return { account: updatedAccount, transaction: txn };
  });

  return result;
}

// ─── WITHDRAW ─────────────────────────────────────────────────────
export async function withdraw(
  accountId: number,
  amount: string | number,
  description?: string,
  customerId?: number
) {
  const decAmount = validateAmount(amount);

  // Get and validate account
  const { account } = await getAccountById(accountId, customerId);

  if (account.status !== "active") {
    throw new Error("Cannot withdraw from an inactive account");
  }

  const currentBalance = new Decimal(account.balance);
  if (currentBalance.lt(decAmount)) {
    throw new Error("Insufficient balance");
  }

  const newBalance = currentBalance.minus(decAmount);

  // Use database transaction for atomicity
  const result = await db.transaction(async (tx: any) => {
    // Update account balance
    const [updatedAccount] = await tx
      .update(accounts)
      .set({
        balance: newBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning();

    // Create transaction record
    const txnId = generateTransactionId();
    const [txn] = await tx
      .insert(transactions)
      .values({
        transactionId: txnId,
        accountId,
        transactionType: "withdrawal",
        amount: decAmount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        description: description || "Cash withdrawal",
      })
      .returning();

    return { account: updatedAccount, transaction: txn };
  });

  return result;
}

// ─── TRANSFER ─────────────────────────────────────────────────────
export async function transfer(
  fromAccountId: number,
  toAccountNumber: string,
  amount: string | number,
  description?: string,
  customerId?: number
) {
  const decAmount = validateAmount(amount);

  // Get and validate source account
  const { account: sourceAccount } = await getAccountById(fromAccountId, customerId);

  if (sourceAccount.status !== "active") {
    throw new Error("Source account is inactive");
  }

  // Get destination account
  const destResult = await db
    .select()
    .from(accounts)
    .where(eq(accounts.accountNumber, toAccountNumber))
    .limit(1);

  if (destResult.length === 0) {
    throw new Error("Destination account not found");
  }

  const destAccount = destResult[0];

  if (destAccount.status !== "active") {
    throw new Error("Destination account is inactive");
  }

  if (sourceAccount.id === destAccount.id) {
    throw new Error("Cannot transfer to the same account");
  }

  const sourceBalance = new Decimal(sourceAccount.balance);
  if (sourceBalance.lt(decAmount)) {
    throw new Error("Insufficient balance for transfer");
  }

  const newSourceBalance = sourceBalance.minus(decAmount);
  const destBalance = new Decimal(destAccount.balance);
  const newDestBalance = destBalance.plus(decAmount);

  // Use database transaction for atomic transfer
  const result = await db.transaction(async (tx: any) => {
    // Update source account
    const [updatedSource] = await tx
      .update(accounts)
      .set({
        balance: newSourceBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, sourceAccount.id))
      .returning();

    // Update destination account
    const [updatedDest] = await tx
      .update(accounts)
      .set({
        balance: newDestBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, destAccount.id))
      .returning();

    // Create transfer-out transaction
    const txnOutId = generateTransactionId();
    const [txnOut] = await tx
      .insert(transactions)
      .values({
        transactionId: txnOutId,
        accountId: sourceAccount.id,
        transactionType: "transfer_out",
        amount: decAmount.toFixed(2),
        balanceAfter: newSourceBalance.toFixed(2),
        reference: destAccount.accountNumber,
        description: description || `Transfer to ${destAccount.accountNumber}`,
      })
      .returning();

    // Create transfer-in transaction
    const txnInId = generateTransactionId();
    const [txnIn] = await tx
      .insert(transactions)
      .values({
        transactionId: txnInId,
        accountId: destAccount.id,
        transactionType: "transfer_in",
        amount: decAmount.toFixed(2),
        balanceAfter: newDestBalance.toFixed(2),
        reference: sourceAccount.accountNumber,
        description: description || `Transfer from ${sourceAccount.accountNumber}`,
      })
      .returning();

    return {
      sourceAccount: updatedSource,
      destAccount: updatedDest,
      transferOut: txnOut,
      transferIn: txnIn,
    };
  });

  return result;
}

// ─── Get Transactions for Account ────────────────────────────────
export async function getAccountTransactions(
  accountId: number,
  options?: {
    type?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions = [eq(transactions.accountId, accountId)];

  if (options?.type) {
    conditions.push(eq(transactions.transactionType, options.type));
  }

  if (options?.search) {
    conditions.push(
      sql`(${transactions.description} ILIKE ${"%" + options.search + "%"} OR ${transactions.transactionId} ILIKE ${"%" + options.search + "%"} OR ${transactions.reference} ILIKE ${"%" + options.search + "%"})`
    );
  }

  if (options?.dateFrom) {
    conditions.push(gte(transactions.createdAt, new Date(options.dateFrom)));
  }

  if (options?.dateTo) {
    const dateTo = new Date(options.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    conditions.push(lte(transactions.createdAt, dateTo));
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const txns = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ total: count() })
    .from(transactions)
    .where(and(...conditions));

  return {
    transactions: txns,
    total: countResult[0]?.total || 0,
    limit,
    offset,
  };
}

// ─── Get Customer Profile ─────────────────────────────────────────
export async function getCustomerProfile(customerDbId: number) {
  const result = await db
    .select({
      customer: customers,
      user: users,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customers.id, customerDbId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Customer not found");
  }

  return result[0];
}

// ─── ADMIN: Get Dashboard Statistics ──────────────────────────────
export async function getAdminDashboardStats() {
  const [totalCustomers, totalAccounts, totalTransactions, activeAccounts, totalBalance] =
    await Promise.all([
      db.select({ total: count() }).from(customers),
      db.select({ total: count() }).from(accounts),
      db.select({ total: count() }).from(transactions),
      db.select({ total: count() }).from(accounts).where(eq(accounts.status, "active")),
      db.select({ total: sum(accounts.balance) }).from(accounts),
    ]);

  // Get recent transactions
  const recentTransactions = await db
    .select({
      transaction: transactions,
      account: accounts,
      customer: customers,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(customers, eq(accounts.customerIdFk, customers.id))
    .orderBy(desc(transactions.createdAt))
    .limit(10);

  // Transaction type breakdown
  const typeBreakdown = await db
    .select({
      type: transactions.transactionType,
      total: count(),
      totalAmount: sum(transactions.amount),
    })
    .from(transactions)
    .groupBy(transactions.transactionType);

  return {
    totalCustomers: totalCustomers[0]?.total || 0,
    totalAccounts: totalAccounts[0]?.total || 0,
    totalTransactions: totalTransactions[0]?.total || 0,
    activeAccounts: activeAccounts[0]?.total || 0,
    totalBalance: totalBalance[0]?.total || "0.00",
    recentTransactions,
    typeBreakdown,
  };
}

// ─── ADMIN: Get All Customers ─────────────────────────────────────
export async function adminGetCustomers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (options?.search) {
    conditions.push(
      sql`(${customers.fullName} ILIKE ${"%" + options.search + "%"} OR ${customers.customerId} ILIKE ${"%" + options.search + "%"} OR ${customers.email} ILIKE ${"%" + options.search + "%"})`
    );
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const result = await db
    .select({
      customer: customers,
      user: users,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: count() })
    .from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { customers: result, total: countResult[0]?.total || 0 };
}

// ─── ADMIN: Get All Accounts ──────────────────────────────────────
export async function adminGetAccounts(options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (options?.status) {
    conditions.push(eq(accounts.status, options.status));
  }

  if (options?.search) {
    conditions.push(
      sql`(${accounts.accountNumber} ILIKE ${"%" + options.search + "%"} OR ${customers.fullName} ILIKE ${"%" + options.search + "%"} OR ${customers.customerId} ILIKE ${"%" + options.search + "%"})`
    );
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const result = await db
    .select({
      account: accounts,
      customer: customers,
    })
    .from(accounts)
    .innerJoin(customers, eq(accounts.customerIdFk, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(accounts.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: count() })
    .from(accounts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { accounts: result, total: countResult[0]?.total || 0 };
}

// ─── ADMIN: Get All Transactions ──────────────────────────────────
export async function adminGetTransactions(options?: {
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  accountNumber?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (options?.type) {
    conditions.push(eq(transactions.transactionType, options.type));
  }

  if (options?.accountNumber) {
    conditions.push(eq(accounts.accountNumber, options.accountNumber));
  }

  if (options?.search) {
    conditions.push(
      sql`(${transactions.transactionId} ILIKE ${"%" + options.search + "%"} OR ${accounts.accountNumber} ILIKE ${"%" + options.search + "%"} OR ${customers.fullName} ILIKE ${"%" + options.search + "%"})`
    );
  }

  if (options?.dateFrom) {
    conditions.push(gte(transactions.createdAt, new Date(options.dateFrom)));
  }

  if (options?.dateTo) {
    const dateTo = new Date(options.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    conditions.push(lte(transactions.createdAt, dateTo));
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const result = await db
    .select({
      transaction: transactions,
      account: accounts,
      customer: customers,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(customers, eq(accounts.customerIdFk, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: count() })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(customers, eq(accounts.customerIdFk, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { transactions: result, total: countResult[0]?.total || 0 };
}

// ─── ADMIN: Toggle Account Status ─────────────────────────────────
export async function toggleAccountStatus(accountId: number, newStatus: "active" | "inactive") {
  const account = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (account.length === 0) {
    throw new Error("Account not found");
  }

  const [updated] = await db
    .update(accounts)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId))
    .returning();

  return updated;
}

// ─── Customer Dashboard Stats ─────────────────────────────────────
export async function getCustomerDashboardStats(customerDbId: number) {
  const customerAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.customerIdFk, customerDbId));

  const accountIds = customerAccounts.map((a: { id: number }) => a.id);

  let totalBalance = new Decimal(0);
  for (const acc of customerAccounts) {
    totalBalance = totalBalance.plus(new Decimal(acc.balance));
  }

  let recentTransactions: typeof transactions.$inferSelect[] = [];
  if (accountIds.length > 0) {
    recentTransactions = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.accountId} IN (${sql.join(accountIds.map((id: number) => sql`${id}`), sql`, `)})`)
      .orderBy(desc(transactions.createdAt))
      .limit(10);
  }

  const txnCountResult = accountIds.length > 0
    ? await db
        .select({ total: count() })
        .from(transactions)
        .where(sql`${transactions.accountId} IN (${sql.join(accountIds.map((id: number) => sql`${id}`), sql`, `)})`)
    : [{ total: 0 }];

  return {
    accounts: customerAccounts,
    totalBalance: totalBalance.toFixed(2),
    recentTransactions,
    totalTransactions: txnCountResult[0]?.total || 0,
  };
}
