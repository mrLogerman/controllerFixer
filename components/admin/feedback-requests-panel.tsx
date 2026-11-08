"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { vancouverToday, type FeedbackDisplayStatus } from "@/lib/feedback-invite";
import type { FeedbackRequestSummary } from "@/lib/feedback-requests";

type Status = { tone: "ok" | "error"; message: string } | null;

const statusLabel: Record<FeedbackDisplayStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  approved: "Approved",
  disabled: "Disabled",
  expired: "Expired",
};

const statusClass: Record<FeedbackDisplayStatus, string> = {
  pending: "bg-[#fff4d6] text-[#6b5312]",
  submitted: "bg-[#ece8ff] text-[#4636a0]",
  approved: "bg-[#e7f6da] text-[#2f6a1a]",
  disabled: "bg-[#eee] text-[#666]",
  expired: "bg-[#eee] text-[#666]",
};

function Banner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      role={status.tone === "error" ? "alert" : "status"}
      className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
        status.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
      }`}
    >
      {status.tone === "ok" ? <Check className="size-4 shrink-0" /> : null}
      {status.message}
    </p>
  );
}

function feedbackUrl(token: string, siteUrl: string) {
  const origin = typeof window === "undefined" ? siteUrl : window.location.origin;
  return `${origin}/feedback/${token}`;
}

export function FeedbackRequestsPanel({
  requests,
  siteUrl,
  onChange,
}: {
  requests: FeedbackRequestSummary[];
  siteUrl: string;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState("");

  async function copy(token: string) {
    const url = feedbackUrl(token, siteUrl);
    await navigator.clipboard.writeText(url);
    setCopied(token);
    window.setTimeout(() => setCopied((current) => (current === token ? "" : current)), 2000);
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setStatus(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/feedback-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: data.get("customerName"),
        controllerType: data.get("controllerType"),
        repair: data.get("repair"),
        repairDate: data.get("repairDate"),
        message: data.get("message"),
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      token?: string;
    } | null;
    setBusy(null);

    if (!response.ok || !result?.token) {
      setStatus({ tone: "error", message: result?.error ?? "Could not create that link." });
      return;
    }

    const url = feedbackUrl(result.token, siteUrl);
    setLink(url);
    setStatus({ tone: "ok", message: "Feedback link ready. Copy it and send it to the customer." });
    event.currentTarget.reset();
    onChange();
  }

  async function act(id: string, action: "disable" | "regenerate" | "approve" | "delete") {
    setBusy(`${action}:${id}`);
    setStatus(null);
    const response =
      action === "delete"
        ? await fetch(`/api/admin/feedback-requests?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          })
        : await fetch("/api/admin/feedback-requests", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action }),
          });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      token?: string;
    } | null;
    setBusy(null);

    if (!response.ok) {
      setStatus({ tone: "error", message: result?.error ?? "Could not update that link." });
      return;
    }

    if (action === "regenerate" && result?.token) {
      const url = feedbackUrl(result.token, siteUrl);
      setLink(url);
      setStatus({ tone: "ok", message: "New link ready. The previous address no longer works." });
    } else if (action === "approve") {
      setStatus({ tone: "ok", message: "Review approved. It can now appear on the site." });
    }

    onChange();
  }

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
        Personal feedback links
      </h2>
      <p className="mt-1 text-sm text-[#73756f]">
        One private link per customer. A review stays pending until you approve it.
        Unused links expire after 90 days.
      </p>

      <form onSubmit={create} className="mt-5 rounded-3xl bg-[#f7f7f4] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
              Customer name
            </span>
            <input name="customerName" required className="field" placeholder="Alex Morgan" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
              Controller type
            </span>
            <input
              name="controllerType"
              required
              list="controller-types"
              className="field"
              placeholder="PlayStation 5"
            />
            <datalist id="controller-types">
              <option value="PlayStation 5" />
              <option value="Xbox" />
              <option value="Xbox Elite" />
              <option value="DualSense Edge" />
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
              Repair performed
            </span>
            <input
              name="repair"
              required
              list="repair-types"
              className="field"
              placeholder="Hall Effect upgrade"
            />
            <datalist id="repair-types">
              <option value="Stick drift repair" />
              <option value="Hall Effect upgrade" />
              <option value="TMR upgrade" />
              <option value="Button repair" />
              <option value="Trigger repair" />
              <option value="Charging port repair" />
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
              Repair date
            </span>
            <input
              name="repairDate"
              required
              type="date"
              defaultValue={vancouverToday()}
              className="field"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
              Personal note <span className="font-normal normal-case">(optional)</span>
            </span>
            <textarea
              name="message"
              maxLength={400}
              className="field min-h-20 resize-y"
              placeholder="Glad we could get it back to you the same day."
            />
          </label>
        </div>
        <Banner status={status} />
        {link ? (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 break-all text-sm font-medium">{link}</p>
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={() => {
                const token = link.split("/feedback/")[1] ?? "";
                void copy(token);
              }}
            >
              <Copy className="size-3.5" />
              {copied && link.endsWith(copied) ? "Copied" : "Copy link"}
            </Button>
          </div>
        ) : null}
        <Button type="submit" className="mt-5" disabled={busy === "create"}>
          {busy === "create" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Link2 className="size-4" />
          )}
          {busy === "create" ? "Creating..." : "Generate feedback link"}
        </Button>
      </form>

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-[#73756f]">No feedback links yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {requests.map((item) => {
            const url = feedbackUrl(item.token, siteUrl);
            const pending = busy?.endsWith(item.id) ?? false;
            return (
              <li key={item.id} className="rounded-2xl border border-[#e0e1db] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.customerName}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] ${statusClass[item.displayStatus]}`}
                      >
                        {statusLabel[item.displayStatus]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#5f615b]">
                      {item.controllerType} · {item.repair} · {item.repairDate}
                    </p>
                    {item.quote ? (
                      <p className="mt-2 text-sm leading-6">
                        {item.rating ? `${item.rating}/5 · ` : ""}“{item.quote}”
                      </p>
                    ) : null}
                    {item.images.length > 0 ? (
                      <div className="mt-3 flex gap-2">
                        {item.images.slice(0, 4).map((src) => (
                          <div
                            key={src}
                            className="relative size-14 overflow-hidden rounded-xl bg-[#e4e5df]"
                          >
                            <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 break-all text-xs text-[#8a8c85]">{url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => copy(item.token)}>
                      <Copy className="size-3.5" />
                      {copied === item.token ? "Copied" : "Copy"}
                    </Button>
                    {item.displayStatus === "pending" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(item.id, "disable")}
                      >
                        Turn off
                      </Button>
                    ) : null}
                    {!item.quote &&
                    (item.displayStatus === "pending" ||
                      item.displayStatus === "expired" ||
                      item.displayStatus === "disabled") ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(item.id, "regenerate")}
                      >
                        <RefreshCw className="size-3.5" />
                        New link
                      </Button>
                    ) : null}
                    {item.displayStatus === "submitted" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(item.id, "approve")}
                      >
                        <ShieldCheck className="size-3.5" />
                        Approve
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Delete feedback link for ${item.customerName}`}
                      disabled={pending}
                      onClick={() => act(item.id, "delete")}
                      className="rounded-full p-2 text-[#9a9c95] hover:bg-red-50 hover:text-red-600"
                    >
                      {pending && busy?.startsWith("delete:") ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
