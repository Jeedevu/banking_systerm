import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, customers, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "banking-system-dev-secret-change-in-production"
);

const COOKIE_NAME = "banking_session";
const SALT_ROUNDS = 12;

export interface SessionPayload {
  userId: number;
  username: string;
  role: "customer" | "admin";
  customerId?: number;
}

// ─── Password Hashing ─────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Session ──────────────────────────────────────────────────
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Get Current Session ──────────────────────────────────────────
export async function getSession(): Promise<SessionPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return verifySession(token);
}

// ─── Require Auth (throws if not authenticated) ───────────────────
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Please log in");
  }
  return session;
}

// ─── Require Role ─────────────────────────────────────────────────
export async function requireRole(role: "customer" | "admin"): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== role) {
    throw new Error(`Forbidden: ${role} access required`);
  }
  return session;
}

// ─── Registration ─────────────────────────────────────────────────
export async function registerUser(data: {
  username: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  accountType: string;
}) {
  // Check if username already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }

  // Check if email already exists
  const existingEmail = await db
    .select()
    .from(customers)
    .where(eq(customers.email, data.email))
    .limit(1);
  if (existingEmail.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(data.password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      username: data.username,
      passwordHash,
      role: "customer",
    })
    .returning();

  // Generate unique customer ID using timestamp + random
  const custTimestamp = Date.now().toString(36).toUpperCase();
  const custRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
  const customerId = `CUST${custTimestamp}${custRandom}`;

  // Create customer profile
  const [customer] = await db
    .insert(customers)
    .values({
      userId: newUser.id,
      customerId,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      email: data.email,
      address: data.address,
    })
    .returning();

  // Generate unique account number using timestamp + random
  const accTimestamp = Date.now().toString(36).toUpperCase();
  const accRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
  const accountNumber = `ACC${accTimestamp}${accRandom}`;

  // Create account
  const [account] = await db
    .insert(accounts)
    .values({
      accountNumber,
      customerIdFk: customer.id,
      accountType: data.accountType,
      balance: "0.00",
      status: "active",
    })
    .returning();

  return { user: newUser, customer, account };
}

// ─── Login ────────────────────────────────────────────────────────
export async function loginUser(
  username: string,
  password: string
): Promise<SessionPayload> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = result[0];
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  // Get customer ID if customer role
  let customerId: number | undefined;
  if (user.role === "customer") {
    const cust = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1);
    customerId = cust[0]?.id;
  }

  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as "customer" | "admin",
    customerId,
  };

  const token = await createSession(payload);
  await setSessionCookie(token);

  return payload;
}

// ─── Logout ───────────────────────────────────────────────────────
export async function logoutUser() {
  await clearSessionCookie();
}
