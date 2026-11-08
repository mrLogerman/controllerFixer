import type { Metadata } from "next";
import { FeedbackShell } from "@/components/feedback/feedback-shell";

export const metadata: Metadata = {
  title: "Feedback",
  robots: { index: false, follow: false },
};

export default function FeedbackIndexPage() {
  return (
    <FeedbackShell>
      <span className="eyebrow">Personal link</span>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em]">
        This page is for a personal feedback link.
      </h1>
      <p className="mt-4 text-base leading-7 text-[#5f615b]">
        Open the full address from the message we sent you. Each link belongs to
        one repair, so there isn&apos;t a general form here.
      </p>
    </FeedbackShell>
  );
}
