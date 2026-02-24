import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  setSessionCookies,
} from "@/lib/auth";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.pin !== "string" || !/^\d{4,8}$/.test(body.pin)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pin } = body;
  const adminHash = process.env.ADMIN_PIN_HASH;
  const friendHash = process.env.FRIEND_PIN_HASH;

  console.log("[login] adminHash:", adminHash ?? "MISSING");
  console.log("[login] friendHash:", friendHash ?? "MISSING");

  if (!adminHash || !friendHash) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let role: Role | null = null;
  if (await bcrypt.compare(pin, adminHash)) role = "admin";
  else if (await bcrypt.compare(pin, friendHash)) role = "friend";

  if (!role) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = await createSessionToken(role);
  const res = NextResponse.json({ role });
  setSessionCookies(res, role, token);
  return res;
}
