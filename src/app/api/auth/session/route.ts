import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Session check failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
