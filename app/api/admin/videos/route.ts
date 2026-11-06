import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSanity, requireSignIn } from "@/lib/admin-api";
import { joystickTypes } from "@/lib/joysticks";
import { writeClient } from "@/lib/sanity";

const videoFields = z.object({
  url: z
    .string()
    .trim()
    .url("Paste a full video link, including https://")
    .refine((value) => /^https?:\/\//.test(value), "The link has to start with http"),
  title: z.string().trim().max(120).optional(),
  category: z.enum(
    joystickTypes.map((type) => type.key) as [
      "traditional",
      "hallEffect",
      "tmr",
    ],
  ),
});

function readBody(body: unknown) {
  if (!body || typeof body !== "object") return videoFields.safeParse({});
  const record = body as Record<string, unknown>;
  return videoFields.safeParse({
    url: record.url,
    title: typeof record.title === "string" && record.title.trim()
      ? record.title
      : undefined,
    category: record.category,
  });
}

export async function POST(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const parsed = readBody(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the link." },
      { status: 400 },
    );
  }

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  try {
    await writeClient().create({
      _type: "joystickVideo",
      url: parsed.data.url,
      title: parsed.data.title ?? "",
      category: parsed.data.category,
    });
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity video write failed:", error);
    return NextResponse.json(
      { error: "Could not save that video." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
  } | null;
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing video id." }, { status: 400 });
  }

  const parsed = readBody(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the link." },
      { status: 400 },
    );
  }

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  try {
    await writeClient()
      .patch(id)
      .set({
        url: parsed.data.url,
        title: parsed.data.title ?? "",
        category: parsed.data.category,
      })
      .commit();
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity video update failed:", error);
    return NextResponse.json(
      { error: "Could not update that video." },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing video id." }, { status: 400 });
  }

  try {
    await writeClient().delete(id);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity video delete failed:", error);
    return NextResponse.json(
      { error: "Could not remove that video." },
      { status: 502 },
    );
  }
}
