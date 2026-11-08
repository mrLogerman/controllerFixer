import type { Metadata } from "next";
import { CustomerFeedbackForm } from "@/components/feedback/customer-feedback-form";
import { FeedbackShell } from "@/components/feedback/feedback-shell";
import { loadFeedbackPage } from "@/lib/feedback-requests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How did we do?",
  robots: { index: false, follow: false },
};

const copy = {
  invalid: {
    eyebrow: "Link",
    title: "This feedback link doesn't look right.",
    body: "Check the address in the message we sent you, or ask us for a fresh link.",
  },
  expired: {
    eyebrow: "Link expired",
    title: "This feedback link has expired.",
    body: "Unused links last 90 days. Reply to the message we sent you and we'll send a new one.",
  },
  disabled: {
    eyebrow: "Link turned off",
    title: "This feedback link is no longer active.",
    body: "If you still want to share how the repair went, ask us and we'll send a new link.",
  },
  used: {
    eyebrow: "Already sent",
    title: "Thanks — we already have your feedback.",
    body: "This link can only be used once. If you need to change what you sent, reply to the shop and we'll take care of it.",
  },
  unavailable: {
    eyebrow: "One moment",
    title: "Feedback isn't available right now.",
    body: "Please try the link again in a little while.",
  },
} as const;

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await loadFeedbackPage(token);

  if (result.kind === "ready") {
    return (
      <FeedbackShell>
        <CustomerFeedbackForm invite={result.invite} />
      </FeedbackShell>
    );
  }

  const message = copy[result.kind];

  return (
    <FeedbackShell>
      <span className="eyebrow">{message.eyebrow}</span>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em]">
        {message.title}
      </h1>
      <p className="mt-4 text-base leading-7 text-[#5f615b]">{message.body}</p>
    </FeedbackShell>
  );
}
