import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vcr_admin";

const SESSION_MS = 1000 * 60 * 60 * 12;

export function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "admin";
}

function signingSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? adminPassword();
}

function sign(value: string) {
  return createHmac("sha256", signingSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(candidate: string) {
  return safeEqual(candidate, adminPassword());
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_MS;
  return `${expires}.${sign(String(expires))}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  };
}

export function tokenIsValid(token: string | undefined) {
  if (!token) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;

  return Number(expires) > Date.now();
}

export async function isSignedIn() {
  const store = await cookies();
  return tokenIsValid(store.get(ADMIN_COOKIE)?.value);
}
