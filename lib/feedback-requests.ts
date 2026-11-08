import { randomUUID } from "node:crypto";
import { draftClient, sanityWritable, writeClient } from "@/lib/sanity";
import type { SanityImageAsset } from "@/lib/sanity-images";
import {
  createFeedbackToken,
  displayStatus,
  firstName,
  formatRepairDate,
  isFeedbackLinkStatus,
  isFeedbackToken,
  pageKind,
  type FeedbackDisplayStatus,
  type FeedbackLinkStatus,
  type FeedbackPageKind,
} from "@/lib/feedback-invite";

export type FeedbackRequestSummary = {
  id: string;
  token: string;
  customerName: string;
  controllerType: string;
  repair: string;
  repairDate: string;
  message: string;
  status: FeedbackLinkStatus;
  displayStatus: FeedbackDisplayStatus;
  rating?: number;
  quote?: string;
  images: string[];
  createdAt: string;
  submittedAt?: string;
  testimonialId?: string;
};

export type ReadyInvite = {
  token: string;
  firstName: string;
  customerName: string;
  controllerType: string;
  repair: string;
  repairDateLabel: string;
  message?: string;
};

type RequestRecord = {
  id: string;
  rev: string;
  token: string;
  customerName: string;
  controllerType: string;
  repair: string;
  repairDate: string;
  message?: string;
  status: string;
  issuedAt?: string;
  submittedAt?: string;
  rating?: number | null;
  quote?: string;
  images?: SanityImageAsset[];
  imageUrls?: (string | null)[];
  testimonialId?: string;
  createdAt: string;
};

async function fetchDraft<T>(query: string, params?: Record<string, string>) {
  const client = draftClient() as {
    fetch: (query: string, params?: Record<string, string>) => Promise<T>;
  };
  return client.fetch(query, params);
}

const REQUEST_FIELDS = `{
  "id": _id,
  "rev": _rev,
  token,
  customerName,
  controllerType,
  repair,
  repairDate,
  message,
  status,
  issuedAt,
  submittedAt,
  rating,
  quote,
  images,
  "imageUrls": images[].asset->url,
  testimonialId,
  "createdAt": _createdAt
}`;

function sized(url: string | null | undefined) {
  if (!url) return null;
  return `${url}?w=1200&auto=format`;
}

function asRecord(row: RequestRecord | null): RequestRecord | null {
  if (!row?.id || !row.token || !isFeedbackLinkStatus(row.status)) return null;
  return row;
}

function summaryFrom(row: RequestRecord): FeedbackRequestSummary {
  const status = row.status as FeedbackLinkStatus;
  return {
    id: row.id,
    token: row.token,
    customerName: row.customerName,
    controllerType: row.controllerType,
    repair: row.repair,
    repairDate: row.repairDate,
    message: row.message ?? "",
    status,
    displayStatus: displayStatus({
      status,
      issuedAt: row.issuedAt ?? row.createdAt,
    }),
    rating:
      typeof row.rating === "number" && row.rating >= 1 && row.rating <= 5
        ? Math.round(row.rating)
        : undefined,
    quote: row.quote || undefined,
    images: (row.imageUrls ?? [])
      .map((url) => sized(url))
      .filter((url): url is string => Boolean(url)),
    createdAt: row.createdAt,
    submittedAt: row.submittedAt,
    testimonialId: row.testimonialId,
  };
}

export async function listFeedbackRequests(): Promise<FeedbackRequestSummary[]> {
  if (!sanityWritable) return [];

  const rows = await fetchDraft<RequestRecord[]>(
    `*[_type == "feedbackRequest"] | order(coalesce(issuedAt, _createdAt) desc) ${REQUEST_FIELDS}`,
  );

  return (rows ?? []).map(asRecord).flatMap((row) => (row ? [summaryFrom(row)] : []));
}

export async function getFeedbackRequestByToken(token: string) {
  if (!isFeedbackToken(token) || !sanityWritable) return null;

  const row = await fetchDraft<RequestRecord | null>(
    `*[_type == "feedbackRequest" && token == $token][0] ${REQUEST_FIELDS}`,
    { token },
  );

  return asRecord(row);
}

export async function loadFeedbackPage(token: string): Promise<
  | { kind: Exclude<FeedbackPageKind, "ready"> }
  | { kind: "ready"; invite: ReadyInvite }
> {
  if (!isFeedbackToken(token)) return { kind: "invalid" };
  if (!sanityWritable) return { kind: "unavailable" };

  let row: RequestRecord | null = null;
  try {
    row = await getFeedbackRequestByToken(token);
  } catch (error) {
    console.error("Feedback invite lookup failed:", error);
    return { kind: "unavailable" };
  }

  const kind = pageKind({
    sanityReady: true,
    tokenValid: true,
    status: row && isFeedbackLinkStatus(row.status) ? row.status : null,
    issuedAt: row?.issuedAt ?? row?.createdAt,
  });

  if (kind !== "ready" || !row) {
    return { kind: kind === "ready" ? "invalid" : kind };
  }
  const message = row.message?.trim();

  return {
    kind: "ready",
    invite: {
      token,
      firstName: firstName(row.customerName),
      customerName: row.customerName,
      controllerType: row.controllerType,
      repair: row.repair,
      repairDateLabel: formatRepairDate(row.repairDate),
      message: message || undefined,
    },
  };
}

export async function createFeedbackRequest(input: {
  customerName: string;
  controllerType: string;
  repair: string;
  repairDate: string;
  message?: string;
}) {
  const token = createFeedbackToken();
  const id = `drafts.feedbackRequest-${randomUUID()}`;
  const issuedAt = new Date().toISOString();

  await writeClient().create({
    _id: id,
    _type: "feedbackRequest",
    token,
    customerName: input.customerName,
    controllerType: input.controllerType,
    repair: input.repair,
    repairDate: input.repairDate,
    message: input.message ?? "",
    status: "pending",
    issuedAt,
  });

  return { id, token };
}

export async function disableFeedbackRequest(id: string) {
  const current = await readById(id);
  if (!current) return { error: "That feedback link was not found." as const };
  if (displayStatus({ status: current.status as FeedbackLinkStatus, issuedAt: current.issuedAt ?? current.createdAt }) !== "pending") {
    return { error: "Only a pending link can be turned off." as const };
  }

  await writeClient().patch(id).set({ status: "disabled" }).commit();
  return { ok: true as const };
}

export async function regenerateFeedbackRequest(id: string) {
  const current = await readById(id);
  if (!current) return { error: "That feedback link was not found." as const };

  const display = displayStatus({
    status: current.status as FeedbackLinkStatus,
    issuedAt: current.issuedAt ?? current.createdAt,
  });
  const canRegenerate =
    display === "pending" || display === "expired" || display === "disabled";
  if (!canRegenerate || current.quote) {
    return { error: "This link already has a review, so it can't be regenerated." as const };
  }

  const token = createFeedbackToken();
  await writeClient()
    .patch(id)
    .set({ token, status: "pending", issuedAt: new Date().toISOString() })
    .commit();

  return { ok: true as const, token };
}

export async function approveFeedbackRequest(id: string) {
  const current = await readById(id);
  if (!current) return { error: "That feedback link was not found." as const };
  if (current.status !== "submitted" || !current.quote || !current.rating) {
    return { error: "There isn't a review waiting for approval." as const };
  }
  if (current.testimonialId) {
    return { error: "This review is already approved." as const };
  }

  const repair = [current.controllerType, current.repair].filter(Boolean).join(" ");
  const published = await writeClient().create({
    _type: "testimonial",
    quote: current.quote,
    name: current.customerName,
    repair,
    rating: current.rating,
    status: "approved",
    images: current.images ?? [],
  });

  try {
    await writeClient()
      .patch(id)
      .ifRevisionId(current.rev)
      .set({ status: "approved", testimonialId: published._id })
      .commit();
  } catch (error) {
    await writeClient().delete(published._id).catch(() => undefined);
    throw error;
  }

  return { ok: true as const };
}

type SubmitError = "invalid" | "expired" | "disabled" | "used" | "unavailable";

export async function submitFeedbackRequest(input: {
  token: string;
  rating: number;
  quote: string;
  images: SanityImageAsset[];
}): Promise<{ ok: true } | { error: SubmitError }> {
  const current = await getFeedbackRequestByToken(input.token);
  if (!current) return { error: "invalid" as const };

  const kind = pageKind({
    sanityReady: true,
    tokenValid: true,
    status: isFeedbackLinkStatus(current.status) ? current.status : null,
    issuedAt: current.issuedAt ?? current.createdAt,
  });
  if (kind !== "ready") return { error: kind };

  try {
    await writeClient()
      .patch(current.id)
      .ifRevisionId(current.rev)
      .set({
        status: "submitted",
        submittedAt: new Date().toISOString(),
        rating: input.rating,
        quote: input.quote,
        images: input.images,
      })
      .commit();
  } catch (error) {
    const latest = await getFeedbackRequestByToken(input.token);
    const latestKind = pageKind({
      sanityReady: true,
      tokenValid: true,
      status: latest && isFeedbackLinkStatus(latest.status) ? latest.status : null,
      issuedAt: latest?.issuedAt ?? latest?.createdAt,
    });
    if (latestKind !== "ready") return { error: latestKind };
    throw error;
  }

  return { ok: true as const };
}

export async function deleteFeedbackRequest(id: string) {
  const current = await readById(id);
  if (!current) return { error: "That feedback link was not found." as const };

  if (current.testimonialId) {
    await writeClient().delete(current.testimonialId).catch((error) => {
      console.error("Could not delete the published review:", error);
    });
  }

  await writeClient().delete(id);
  return { ok: true as const };
}

export async function deleteRequestForTestimonial(testimonialId: string) {
  if (!sanityWritable) return;

  const id = await fetchDraft<string | null>(
    `*[_type == "feedbackRequest" && testimonialId == $testimonialId][0]._id`,
    { testimonialId },
  );

  if (!id) return;
  await writeClient().patch(id).set({ status: "disabled" }).unset(["testimonialId"]).commit();
}

async function readById(id: string) {
  if (!id.startsWith("drafts.")) return null;
  const row = await fetchDraft<RequestRecord | null>(
    `*[_id == $id][0] ${REQUEST_FIELDS}`,
    { id },
  );
  return asRecord(row);
}
