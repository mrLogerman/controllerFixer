import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSanity, requireSignIn } from "@/lib/admin-api";
import { joystickTypes } from "@/lib/joysticks";
import { writeClient } from "@/lib/sanity";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 8;

const fields = z.object({
  quote: z.string().trim().min(10, "Feedback needs at least 10 characters").max(800),
  name: z.string().trim().min(2, "Add the customer's name").max(60),
  repair: z.string().trim().max(80).optional(),
  category: z.enum(
    joystickTypes.map((type) => type.key) as [
      "traditional",
      "hallEffect",
      "tmr",
    ],
  ),
});

type ImageAsset = {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
};

async function readImages(form: FormData) {
  const files = form
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_IMAGES) {
    return { error: `Upload ${MAX_IMAGES} photos at a time.` };
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { error: "Every file needs to be an image." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Each photo needs to be under 8 MB." };
    }
  }

  const client = writeClient();
  const images: ImageAsset[] = [];

  for (const file of files) {
    const asset = await client.assets.upload(
      "image",
      Buffer.from(await file.arrayBuffer()),
      { filename: file.name, contentType: file.type },
    );
    images.push({
      _type: "image",
      _key: randomUUID(),
      asset: { _type: "reference", _ref: asset._id },
    });
  }

  return { images };
}

function readFields(form: FormData) {
  return fields.safeParse({
    quote: form.get("quote"),
    name: form.get("name"),
    repair: form.get("repair") || undefined,
    category: form.get("category"),
  });
}

export async function POST(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const form = await request.formData();
  const parsed = readFields(form);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  try {
    const uploaded = await readImages(form);
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    await writeClient().create({
      _type: "testimonial",
      ...parsed.data,
      repair: parsed.data.repair ?? "",
      images: uploaded.images,
    });

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity feedback write failed:", error);
    return NextResponse.json(
      { error: "Could not save to Sanity. Check the project ID and token." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const form = await request.formData();
  const id = form.get("id");

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Missing feedback id." }, { status: 400 });
  }

  const parsed = readFields(form);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  try {
    const uploaded = await readImages(form);
    if ("error" in uploaded && uploaded.error) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    await writeClient()
      .patch(id)
      .set({
        ...parsed.data,
        repair: parsed.data.repair ?? "",
        // New photos replace the set. Leaving the picker empty keeps the old ones.
        ...(uploaded.images && uploaded.images.length > 0
          ? { images: uploaded.images }
          : {}),
      })
      .commit();

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity feedback update failed:", error);
    return NextResponse.json(
      { error: "Could not update that feedback." },
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
    return NextResponse.json({ error: "Missing feedback id." }, { status: 400 });
  }

  try {
    await writeClient().delete(id);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity feedback delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete that feedback." },
      { status: 502 },
    );
  }
}
