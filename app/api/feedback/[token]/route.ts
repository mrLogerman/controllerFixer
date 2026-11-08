import { NextResponse } from "next/server";
import { z } from "zod";
import { isFeedbackLinkStatus, isFeedbackToken, pageKind } from "@/lib/feedback-invite";
import { getFeedbackRequestByToken, submitFeedbackRequest } from "@/lib/feedback-requests";
import { uploadFormImages } from "@/lib/sanity-images";
import { sanityWritable } from "@/lib/sanity";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const fields = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(10, "Tell us a little more about the repair.").max(800),
  website: z.string().optional(),
  started: z.coerce.number(),
  turnstileToken: z.string().optional(),
});

const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function turnstileOk(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token ?? "" }),
  });
  const verification = (await response.json()) as { success?: boolean };
  return Boolean(verification.success);
}

const messages: Record<string, { error: string; status: number }> = {
  invalid: { error: "This feedback link doesn't look right.", status: 404 },
  expired: { error: "This feedback link has expired.", status: 410 },
  disabled: { error: "This feedback link has been turned off.", status: 410 },
  used: { error: "This review was already sent.", status: 409 },
  unavailable: { error: "Feedback isn't available right now.", status: 503 },
};

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { error: "Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const { token } = await context.params;
  if (!isFeedbackToken(token)) {
    return NextResponse.json({ error: messages.invalid.error }, { status: messages.invalid.status });
  }

  if (!sanityWritable) {
    return NextResponse.json({ error: messages.unavailable.error }, { status: 503 });
  }

  const form = await request.formData();
  const parsed = fields.safeParse({
    rating: form.get("rating"),
    quote: form.get("quote"),
    website: form.get("website") || undefined,
    started: form.get("started"),
    turnstileToken: form.get("turnstileToken") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const elapsed = Date.now() - parsed.data.started;
  if (elapsed < 2000 || elapsed > 24 * 60 * 60 * 1000) {
    return NextResponse.json(
      { error: "Please take another look at the form and try again." },
      { status: 400 },
    );
  }

  if (!(await turnstileOk(parsed.data.turnstileToken))) {
    return NextResponse.json(
      { error: "Security check failed. Please refresh and try again." },
      { status: 400 },
    );
  }

  try {
    const current = await getFeedbackRequestByToken(token);
    const kind = pageKind({
      sanityReady: true,
      tokenValid: true,
      status: current && isFeedbackLinkStatus(current.status) ? current.status : null,
      issuedAt: current?.issuedAt ?? current?.createdAt,
    });
    if (kind !== "ready") {
      const message = messages[kind] ?? messages.invalid;
      return NextResponse.json({ error: message.error }, { status: message.status });
    }

    const uploaded = await uploadFormImages(form, { max: 4 });
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    const result = await submitFeedbackRequest({
      token,
      rating: parsed.data.rating,
      quote: parsed.data.quote,
      images: uploaded.images,
    });

    if ("error" in result) {
      const message = messages[result.error];
      return NextResponse.json({ error: message.error }, { status: message.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json(
      { error: "Could not send that review. Please try again." },
      { status: 502 },
    );
  }
}
