import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPgliteClient?: PGlite;
  __arenaNextJsDrizzleDb?: any;
};

function createDb() {
  if (globalForDb.__arenaNextJsDrizzleDb) {
    return globalForDb.__arenaNextJsDrizzleDb;
  }

  const client = globalForDb.__arenaNextJsPgliteClient ?? new PGlite();

  // Create tables using PGlite
  client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      customer_id VARCHAR(20) NOT NULL UNIQUE,
      full_name VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      account_number VARCHAR(20) NOT NULL UNIQUE,
      customer_id_fk INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      account_type VARCHAR(30) NOT NULL DEFAULT 'savings',
      balance DECIMAL(15, 2) NOT NULL DEFAULT '0.00',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      transaction_id VARCHAR(30) NOT NULL UNIQUE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      transaction_type VARCHAR(20) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      balance_after DECIMAL(15, 2) NOT NULL,
      reference VARCHAR(30),
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch((err) => console.error("PGlite schema error:", err));

  const drizzleDb = drizzle({ client });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPgliteClient = client;
    globalForDb.__arenaNextJsDrizzleDb = drizzleDb;
  }

  return drizzleDb;
}

export const db = createDb();
