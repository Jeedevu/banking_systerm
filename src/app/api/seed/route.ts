import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, customers, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json({ message: "Seed data already exists" });
    }

    // Create admin user
    const adminPasswordHash = await bcrypt.hash("admin123", 12);
    await db.insert(users).values({
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "admin",
    });

    // Create test customer 1
    const cust1PasswordHash = await bcrypt.hash("customer123", 12);
    const [user1] = await db.insert(users).values({
      username: "john_doe",
      passwordHash: cust1PasswordHash,
      role: "customer",
    }).returning();

    const [customer1] = await db.insert(customers).values({
      userId: user1.id,
      customerId: "CUST000001",
      fullName: "John Doe",
      dateOfBirth: "1990-05-15",
      phone: "+91-9876543210",
      email: "john.doe@example.com",
      address: "123 Main Street, Mumbai, Maharashtra",
    }).returning();

    await db.insert(accounts).values({
      accountNumber: "ACC00000001",
      customerIdFk: customer1.id,
      accountType: "savings",
      balance: "10000.00",
      status: "active",
    });

    await db.insert(accounts).values({
      accountNumber: "ACC00000002",
      customerIdFk: customer1.id,
      accountType: "current",
      balance: "25000.00",
      status: "active",
    });

    // Create test customer 2
    const cust2PasswordHash = await bcrypt.hash("customer123", 12);
    const [user2] = await db.insert(users).values({
      username: "jane_smith",
      passwordHash: cust2PasswordHash,
      role: "customer",
    }).returning();

    const [customer2] = await db.insert(customers).values({
      userId: user2.id,
      customerId: "CUST000002",
      fullName: "Jane Smith",
      dateOfBirth: "1995-08-22",
      phone: "+91-9123456789",
      email: "jane.smith@example.com",
      address: "456 Park Avenue, Delhi, New Delhi",
    }).returning();

    await db.insert(accounts).values({
      accountNumber: "ACC00000003",
      customerIdFk: customer2.id,
      accountType: "savings",
      balance: "5000.00",
      status: "active",
    });

    // Create test customer 3 (with inactive account)
    const cust3PasswordHash = await bcrypt.hash("customer123", 12);
    const [user3] = await db.insert(users).values({
      username: "bob_wilson",
      passwordHash: cust3PasswordHash,
      role: "customer",
    }).returning();

    const [customer3] = await db.insert(customers).values({
      userId: user3.id,
      customerId: "CUST000003",
      fullName: "Bob Wilson",
      dateOfBirth: "1988-03-10",
      phone: "+91-9988776655",
      email: "bob.wilson@example.com",
      address: "789 Lake Road, Bangalore, Karnataka",
    }).returning();

    await db.insert(accounts).values({
      accountNumber: "ACC00000004",
      customerIdFk: customer3.id,
      accountType: "fixed_deposit",
      balance: "50000.00",
      status: "inactive",
    });

    return NextResponse.json({
      message: "Seed data created successfully",
      accounts: {
        admin: { username: "admin", password: "admin123" },
        customers: [
          { username: "john_doe", password: "customer123", accounts: ["ACC00000001 (₹10,000)", "ACC00000002 (₹25,000)"] },
          { username: "jane_smith", password: "customer123", accounts: ["ACC00000003 (₹5,000)"] },
          { username: "bob_wilson", password: "customer123", accounts: ["ACC00000004 (₹50,000, inactive)"] },
        ],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
