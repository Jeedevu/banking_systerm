import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName, dateOfBirth, phone, email, address, accountType } = body;

    // Validate required fields
    if (!username || !password || !fullName || !dateOfBirth || !phone || !email || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 3 and 50 characters" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate account type
    const validTypes = ["savings", "current", "fixed_deposit"];
    if (accountType && !validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    const result = await registerUser({
      username,
      password,
      fullName,
      dateOfBirth,
      phone,
      email,
      address,
      accountType: accountType || "savings",
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        customerId: result.customer.customerId,
        accountNumber: result.account.accountNumber,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = message.includes("already exists") || message.includes("already registered") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
