import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookies,
} from "@/lib/auth";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.pin !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pin } = body;
  const adminPin = process.env.ADMIN_PIN;
  const friendPin = process.env.FRIEND_PIN;

  if (!adminPin || !friendPin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let role: Role | null = null;
  if (pin === adminPin) role = "admin";
  else if (pin === friendPin) role = "friend";

  if (!role) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = await createSessionToken(role);
  const res = NextResponse.json({ role });
  setSessionCookies(res, role, token);
  return res;
}
