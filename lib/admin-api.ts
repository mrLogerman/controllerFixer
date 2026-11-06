import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/admin-auth";
import { sanityWritable } from "@/lib/sanity";

export async function requireSignIn() {
  if (await isSignedIn()) return null;
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

export function requireSanity() {
  if (sanityWritable) return null;
  return NextResponse.json(
    {
      error:
        "Sanity is not connected yet. Add NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN.",
    },
    { status: 503 },
  );
}
