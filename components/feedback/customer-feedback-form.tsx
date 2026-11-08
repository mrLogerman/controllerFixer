"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Star } from "lucide-react";
import { Turnstile } from "react-turnstile";
import { Button } from "@/components/ui/button";
import type { ReadyInvite } from "@/lib/feedback-requests";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function CustomerFeedbackForm({ invite }: { invite: ReadyInvite }) {
  const [rating, setRating] = useState(0);
  const [started] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setError("Finish the security check first.");
      return;
    }

    setBusy(true);
    setError("");

    const body = new FormData(event.currentTarget);
    body.set("rating", String(rating));
    body.set("started", String(started));
    if (turnstileToken) body.set("turnstileToken", turnstileToken);

    const response = await fetch(`/api/feedback/${invite.token}`, {
      method: "POST",
      body,
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);

    if (!response.ok) {
      setError(result?.error ?? "Could not send that review.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div>
        <span className="eyebrow">Thank you</span>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em]">
          Thank you, {invite.firstName}!
        </h1>
        <p className="mt-4 text-base leading-7 text-[#5f615b]">
          Your review is in. We’ll read it before it appears on the site.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">
            Back to the shop <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <span className="eyebrow">Your repair</span>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Hi {invite.firstName}!
      </h1>
      <div className="mt-4 space-y-3 text-base leading-7 text-[#5f615b]">
        <p>Thank you for trusting us with your {invite.controllerType} controller!</p>
        <p>
          We hope you&apos;re enjoying your controller after the {invite.repair} on{" "}
          {invite.repairDateLabel}.
        </p>
        {invite.message ? (
          <p className="whitespace-pre-wrap text-[#161713]">{invite.message}</p>
        ) : null}
        <p>We&apos;d love to hear about your experience!</p>
      </div>

      <dl className="mt-6 grid gap-3 rounded-2xl bg-[#f6f6f3] p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8a8c85]">
            Name
          </dt>
          <dd className="mt-1 font-semibold">{invite.customerName}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8a8c85]">
            Controller
          </dt>
          <dd className="mt-1 font-semibold">{invite.controllerType}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8a8c85]">
            Repair
          </dt>
          <dd className="mt-1 font-semibold">{invite.repair}</dd>
        </div>
      </dl>

      <fieldset className="mt-7">
        <legend className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
          Star rating
        </legend>
        <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = value <= rating;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setRating(value)}
                className="rounded-2xl p-2 text-[#11120f] transition-colors hover:bg-[#f3f3ef]"
              >
                <Star
                  className={`size-8 ${selected ? "fill-[#b6ff2e] text-[#11120f]" : "text-[#c8c9c3]"}`}
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
          Your review
        </span>
        <textarea
          name="quote"
          required
          minLength={10}
          maxLength={800}
          className="field min-h-32 resize-y"
          placeholder="How does the controller feel now?"
        />
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
          Photos <span className="font-normal normal-case">(optional)</span>
        </span>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="field py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#11120f] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])].slice(0, 4);
            setPreviews(files.map((file) => URL.createObjectURL(file)));
          }}
        />
        {previews.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {previews.map((src) => (
              <div
                key={src}
                className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[#e4e5df]"
              >
                <Image unoptimized src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </label>

      <label className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {turnstileSiteKey ? (
        <div className="mt-6 overflow-hidden">
          <Turnstile
            sitekey={turnstileSiteKey}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
            theme="light"
            size="flexible"
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="mt-6" disabled={busy}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {busy ? "Sending..." : "Send my feedback"}
        {busy ? null : <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
