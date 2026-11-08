import { randomUUID } from "node:crypto";
import { writeClient } from "@/lib/sanity";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type SanityImageAsset = {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
};

export async function uploadFormImages(
  form: FormData,
  options?: { max?: number; field?: string },
) {
  const max = options?.max ?? 8;
  const field = options?.field ?? "images";
  const files = form
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > max) {
    return { error: `Upload ${max} photos at a time.` };
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
  const images: SanityImageAsset[] = [];

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
