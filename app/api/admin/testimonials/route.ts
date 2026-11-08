import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSanity, requireSignIn } from "@/lib/admin-api";
import { deleteRequestForTestimonial } from "@/lib/feedback-requests";
import { uploadFormImages } from "@/lib/sanity-images";
import { writeClient } from "@/lib/sanity";

const fields = z.object({
  quote: z.string().trim().min(10, "Feedback needs at least 10 characters").max(800),
  name: z.string().trim().min(2, "Add the customer's name").max(60),
  repair: z.string().trim().max(80).optional(),
});

async function readImages(form: FormData) {
  return uploadFormImages(form);
}

function readFields(form: FormData) {
  return fields.safeParse({
    quote: form.get("quote"),
    name: form.get("name"),
    repair: form.get("repair") || undefined,
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
      .unset(["category"])
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
    await deleteRequestForTestimonial(id).catch((error) => {
      console.error("Could not remove the feedback link for that review:", error);
    });
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
