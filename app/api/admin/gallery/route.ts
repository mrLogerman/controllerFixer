import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSanity, requireSignIn } from "@/lib/admin-api";
import { writeClient } from "@/lib/sanity";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 12;

export async function POST(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const form = await request.formData();
  const files = form
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });
  }

  if (files.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Upload ${MAX_IMAGES} photos at a time.` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Every file needs to be an image." },
        { status: 400 },
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Each photo needs to be under 8 MB." },
        { status: 400 },
      );
    }
  }

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  try {
    const client = writeClient();

    for (const file of files) {
      const asset = await client.assets.upload(
        "image",
        Buffer.from(await file.arrayBuffer()),
        { filename: file.name, contentType: file.type },
      );
      await client.create({
        _type: "galleryImage",
        image: {
          _type: "image",
          _key: randomUUID(),
          asset: { _type: "reference", _ref: asset._id },
        },
      });
    }

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity gallery upload failed:", error);
    return NextResponse.json(
      { error: "Could not save those photos." },
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
    return NextResponse.json({ error: "Missing photo id." }, { status: 400 });
  }

  try {
    await writeClient().delete(id);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sanity gallery delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete that photo." },
      { status: 502 },
    );
  }
}
