import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;

  const password = typeof body?.password === "string" ? body.password : "";

  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}
