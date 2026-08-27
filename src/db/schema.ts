import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  decimal,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── USERS ────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 20 }).notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unq").on(table.username),
  ]
);

// ─── CUSTOMERS ────────────────────────────────────────────────────
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    customerId: varchar("customer_id", { length: 20 }).notNull(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    address: text("address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customers_customer_id_unq").on(table.customerId),
    uniqueIndex("customers_user_id_unq").on(table.userId),
    index("customers_email_idx").on(table.email),
  ]
);

// ─── ACCOUNTS ─────────────────────────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    accountNumber: varchar("account_number", { length: 20 }).notNull(),
    customerIdFk: integer("customer_id_fk").references(() => customers.id, { onDelete: "cascade" }).notNull(),
    accountType: varchar("account_type", { length: 30 }).notNull().default("savings"),
    balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("accounts_account_number_unq").on(table.accountNumber),
    index("accounts_customer_id_fk_idx").on(table.customerIdFk),
    index("accounts_status_idx").on(table.status),
  ]
);

// ─── TRANSACTIONS ─────────────────────────────────────────────────
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    transactionId: varchar("transaction_id", { length: 30 }).notNull(),
    accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
    transactionType: varchar("transaction_type", { length: 20 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
    reference: varchar("reference", { length: 30 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("transactions_transaction_id_unq").on(table.transactionId),
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_type_idx").on(table.transactionType),
    index("transactions_created_at_idx").on(table.createdAt),
  ]
);
