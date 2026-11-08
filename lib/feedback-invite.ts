import { randomBytes } from "node:crypto";

export const FEEDBACK_LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export const feedbackLinkStatuses = [
  "pending",
  "submitted",
  "approved",
  "disabled",
] as const;

export type FeedbackLinkStatus = (typeof feedbackLinkStatuses)[number];

export type FeedbackDisplayStatus = FeedbackLinkStatus | "expired";

export type FeedbackPageKind =
  | "unavailable"
  | "invalid"
  | "expired"
  | "disabled"
  | "used"
  | "ready";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createFeedbackToken() {
  return randomBytes(32).toString("base64url");
}

export function isFeedbackToken(value: string) {
  return TOKEN_PATTERN.test(value);
}

export function isFeedbackLinkStatus(value: unknown): value is FeedbackLinkStatus {
  return (
    typeof value === "string" &&
    (feedbackLinkStatuses as readonly string[]).includes(value)
  );
}

export function displayStatus(
  doc: { status: FeedbackLinkStatus; issuedAt: string },
  now = Date.now(),
): FeedbackDisplayStatus {
  if (doc.status !== "pending") return doc.status;
  const issued = new Date(doc.issuedAt).getTime();
  if (!Number.isFinite(issued) || now - issued > FEEDBACK_LINK_TTL_MS) return "expired";
  return "pending";
}

export function pageKind(input: {
  sanityReady: boolean;
  tokenValid: boolean;
  status?: FeedbackLinkStatus | null;
  issuedAt?: string | null;
  now?: number;
}): FeedbackPageKind {
  if (!input.sanityReady) return "unavailable";
  if (!input.tokenValid || !input.status) return "invalid";
  const display = displayStatus(
    { status: input.status, issuedAt: input.issuedAt ?? "" },
    input.now ?? Date.now(),
  );
  if (display === "expired") return "expired";
  if (display === "disabled") return "disabled";
  if (display === "submitted" || display === "approved") return "used";
  if (display === "pending") return "ready";
  return "invalid";
}

export function firstName(name: string) {
  const word = name.trim().split(/\s+/)[0]?.replace(/[.,]+$/g, "") ?? "";
  return word || "there";
}

export function formatRepairDate(isoDate: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return isoDate;
  }

  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
  const currentYear = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    year: "numeric",
  }).format(now);

  return String(year) === currentYear ? monthDay : `${monthDay}, ${year}`;
}

export function repairDateError(iso: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "Add the repair date.";
  const [year, month, day] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return "Add a real repair date.";
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  if (iso > today) return "The repair date can't be in the future.";
  if (iso < "2020-01-01") return "Add a more recent repair date.";
  return null;
}

export function vancouverToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
