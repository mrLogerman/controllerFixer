import { createClient, type SanityClient } from "@sanity/client";
import {
  joystickTypes,
  type JoystickKey,
} from "@/lib/joysticks";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = "2024-10-01";

export const sanityConfigured = Boolean(projectId);

// Reads use the public dataset. Writes need a token with Editor rights, and
// that token never leaves the server.
export const sanityWritable = Boolean(projectId && process.env.SANITY_API_TOKEN);

const categories = new Set(joystickTypes.map((type) => type.key));

export function isJoystickKey(value: unknown): value is JoystickKey {
  return typeof value === "string" && categories.has(value as JoystickKey);
}

function client(withToken: boolean): SanityClient {
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: withToken ? process.env.SANITY_API_TOKEN : undefined,
  });
}

export function writeClient() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN is not set");
  }
  return client(true);
}

export type StoredFeedback = {
  id: string;
  quote: string;
  name: string;
  repair?: string;
  images: string[];
  createdAt: string;
};

export type StoredVideo = {
  id: string;
  url: string;
  title?: string;
  category: JoystickKey;
  createdAt: string;
};

export type StoredGalleryImage = {
  id: string;
  url: string;
  createdAt: string;
};

export type SiteContent = {
  feedback: StoredFeedback[];
  videos: StoredVideo[];
  gallery: StoredGalleryImage[];
};

const EMPTY: SiteContent = { feedback: [], videos: [], gallery: [] };

function sized(url: string | null | undefined, width: number) {
  if (!url) return null;
  return `${url}?w=${width}&auto=format`;
}

export async function fetchSiteContent(): Promise<SiteContent> {
  if (!sanityConfigured) return EMPTY;

  const data = await client(false).fetch<{
    feedback: Array<Omit<StoredFeedback, "images"> & { images: (string | null)[] }>;
    videos: StoredVideo[];
    gallery: Array<{ id: string; url: string | null; createdAt: string }>;
  }>(
    `{
      "feedback": *[_type == "testimonial"] | order(_createdAt desc) {
        "id": _id,
        quote,
        name,
        repair,
        "createdAt": _createdAt,
        "images": images[].asset->url
      },
      "videos": *[_type == "joystickVideo" && defined(url)] | order(_createdAt desc) {
        "id": _id,
        url,
        title,
        category,
        "createdAt": _createdAt
      },
      "gallery": *[_type == "galleryImage" && defined(image)] | order(_createdAt desc) {
        "id": _id,
        "url": image.asset->url,
        "createdAt": _createdAt
      }
    }`,
    {},
    { cache: "no-store" },
  );

  return {
    feedback: (data?.feedback ?? [])
      .filter((row) => row.quote && row.name)
      .map((row) => ({
        ...row,
        repair: row.repair || undefined,
        images: (row.images ?? [])
          .map((url) => sized(url, 1200))
          .filter((url): url is string => Boolean(url)),
      })),
    videos: (data?.videos ?? []).filter(
      (row) => row.url && isJoystickKey(row.category),
    ),
    gallery: (data?.gallery ?? [])
      .map((row) => ({ ...row, url: sized(row.url, 1600) }))
      .filter((row): row is StoredGalleryImage => Boolean(row.url)),
  };
}
