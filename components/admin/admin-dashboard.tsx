"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Pencil,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { joystickTypes, type JoystickKey } from "@/lib/joysticks";
import type { SiteContent, StoredFeedback, StoredVideo } from "@/lib/sanity";

type Status = { tone: "ok" | "error"; message: string } | null;

function Banner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      role={status.tone === "error" ? "alert" : "status"}
      className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
        status.tone === "error"
          ? "bg-red-50 text-red-700"
          : "bg-green-50 text-green-800"
      }`}
    >
      {status.tone === "ok" ? <Check className="size-4 shrink-0" /> : null}
      {status.message}
    </p>
  );
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Vancouver",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PhotoPicker({ existing }: { existing?: string[] }) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  return (
    <div>
      <input
        name="images"
        type="file"
        accept="image/*"
        multiple
        className="field py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#11120f] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
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
      ) : existing && existing.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {existing.map((src) => (
            <div
              key={src}
              className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[#e4e5df]"
            >
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FeedbackEditor({
  editing,
  onDone,
  onCancel,
}: {
  editing: StoredFeedback | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    const body = new FormData(event.currentTarget);
    if (editing) body.set("id", editing.id);

    const response = await fetch("/api/admin/testimonials", {
      method: editing ? "PATCH" : "POST",
      body,
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    setBusy(false);

    if (!response.ok) {
      setStatus({ tone: "error", message: result?.error ?? "Could not save." });
      return;
    }

    setStatus({
      tone: "ok",
      message: editing ? "Feedback updated." : "Feedback published.",
    });
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-[#f7f7f4] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Feedback
          </span>
          <textarea
            name="quote"
            required
            defaultValue={editing?.quote ?? ""}
            className="field min-h-24 resize-y"
            placeholder="What the customer said..."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Customer name
          </span>
          <input
            name="name"
            required
            defaultValue={editing?.name ?? ""}
            className="field"
            placeholder="Marcus T."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Repair <span className="font-normal normal-case">(optional)</span>
          </span>
          <input
            name="repair"
            defaultValue={editing?.repair ?? ""}
            className="field"
            placeholder="Hall Effect upgrade"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Photos{" "}
            <span className="font-normal normal-case">
              {editing ? "(optional — new photos replace the current ones)" : "(optional)"}
            </span>
          </span>
          <PhotoPicker existing={editing?.images} />
        </label>
      </div>
      <Banner status={status} />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {busy ? "Saving..." : editing ? "Save changes" : "Publish feedback"}
        </Button>
        {editing ? (
          <Button type="button" variant="dark" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function VideoEditor({
  category,
  editing,
  onDone,
  onCancel,
}: {
  category: JoystickKey;
  editing: StoredVideo | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/videos", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id,
        url: data.get("url"),
        title: data.get("title"),
        category,
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    setBusy(false);

    if (!response.ok) {
      setStatus({ tone: "error", message: result?.error ?? "Could not save." });
      return;
    }

    setStatus({ tone: "ok", message: editing ? "Video updated." : "Video added." });
    onDone();
  }

  return (
    <form key={editing?.id ?? "new"} onSubmit={onSubmit} className="rounded-3xl bg-[#f7f7f4] p-5">
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Video link
          </span>
          <input
            name="url"
            required
            type="url"
            defaultValue={editing?.url ?? ""}
            className="field"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Title <span className="font-normal normal-case">(optional)</span>
          </span>
          <input
            name="title"
            defaultValue={editing?.title ?? ""}
            className="field"
            placeholder="How a Hall Effect stick works"
          />
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#777a73]">
        YouTube, TikTok, Instagram, or any other link. YouTube links play in the
        page; other links open on their own site.
      </p>
      <Banner status={status} />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Video className="size-4" />
          )}
          {busy ? "Saving..." : editing ? "Save video" : "Add video"}
        </Button>
        {editing ? (
          <Button type="button" variant="dark" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FeedbackPanel({
  feedback,
  onChange,
}: {
  feedback: StoredFeedback[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<StoredFeedback | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const formKey = useRef(0);
  const [formVersion, setFormVersion] = useState(0);

  async function remove(id: string) {
    setPending(id);
    setStatus(null);
    const response = await fetch(
      `/api/admin/testimonials?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    setPending(null);
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setStatus({ tone: "error", message: result?.error ?? "Could not delete." });
      return;
    }
    onChange();
  }

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
        Customer feedback
      </h2>
      <p className="mt-1 text-sm text-[#73756f]">
        Photos and a short quote. These are not tied to a joystick type.
      </p>
      <div className="mt-5">
        <FeedbackEditor
          key={`${formVersion}-${editing?.id ?? "new"}`}
          editing={editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            formKey.current += 1;
            setFormVersion(formKey.current);
            onChange();
          }}
        />
      </div>
      {feedback.length === 0 ? (
        <p className="mt-4 text-sm text-[#73756f]">No feedback published yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {feedback.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-2xl border border-[#e0e1db] p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#e4e5df]">
                {item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[#9a9c95]">
                    <ImagePlus className="size-5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-sm leading-5">“{item.quote}”</p>
                <p className="mt-2 text-xs font-bold">
                  {item.name}
                  {item.repair ? (
                    <span className="font-medium text-[#83857e]"> · {item.repair}</span>
                  ) : null}
                </p>
                <p className="text-xs text-[#9a9c95]">
                  {when(item.createdAt)}
                  {item.images.length > 1 ? ` · ${item.images.length} photos` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label={`Edit feedback from ${item.name}`}
                  onClick={() => setEditing(item)}
                  className="h-fit rounded-full p-2 text-[#9a9c95] hover:bg-[#f3f3ef] hover:text-[#11120f]"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete feedback from ${item.name}`}
                  disabled={pending === item.id}
                  onClick={() => remove(item.id)}
                  className="h-fit rounded-full p-2 text-[#9a9c95] hover:bg-red-50 hover:text-red-600"
                >
                  {pending === item.id ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Banner status={status} />
    </section>
  );
}

function CategoryPanel({
  category,
  name,
  videos,
  onChange,
}: {
  category: JoystickKey;
  name: string;
  videos: StoredVideo[];
  onChange: () => void;
}) {
  const [editingVideo, setEditingVideo] = useState<StoredVideo | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function remove(path: string, id: string) {
    setPending(id);
    setStatus(null);
    const response = await fetch(`${path}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setPending(null);
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setStatus({ tone: "error", message: result?.error ?? "Could not delete." });
      return;
    }
    onChange();
  }

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
        {name}
      </h2>
      <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#6e706a]">
        Videos
      </h3>
      <div className="mt-3">
        <VideoEditor
          category={category}
          editing={editingVideo}
          onCancel={() => setEditingVideo(null)}
          onDone={() => {
            setEditingVideo(null);
            onChange();
          }}
        />
      </div>

      {videos.length === 0 ? (
        <p className="mt-4 text-sm text-[#73756f]">No videos for {name} yet.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex items-center gap-3 rounded-2xl border border-[#e0e1db] px-4 py-3"
            >
              <Video className="size-4 shrink-0 text-[#83857e]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {video.title || "Untitled video"}
                </p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-xs text-[#627dff] underline"
                >
                  {video.url}
                </a>
                <p className="text-xs text-[#9a9c95]">{when(video.createdAt)}</p>
              </div>
              <button
                type="button"
                aria-label={`Edit ${video.title || "video"}`}
                onClick={() => setEditingVideo(video)}
                className="rounded-full p-2 text-[#9a9c95] hover:bg-[#f3f3ef] hover:text-[#11120f]"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${video.title || "video"}`}
                disabled={pending === video.id}
                onClick={() => remove("/api/admin/videos", video.id)}
                className="rounded-full p-2 text-[#9a9c95] hover:bg-red-50 hover:text-red-600"
              >
                {pending === video.id ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Banner status={status} />
    </section>
  );
}

export function AdminDashboard({
  content,
  sanityReady,
}: {
  content: SiteContent;
  sanityReady: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="min-h-[100svh] bg-[#ecede8] py-10">
      <div className="page-shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark tone="dark" />
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">
                Site content
              </h1>
              <p className="text-xs text-[#73756f]">
                Feedback on its own. Videos stay with each joystick type.
              </p>
            </div>
          </div>
          <Button variant="dark" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>

        {!sanityReady ? (
          <p className="mt-6 rounded-2xl bg-[#fff4d6] p-4 text-sm leading-6 text-[#6b5312]">
            Sanity is not connected yet, so saving is turned off. Add{" "}
            <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
            <code>SANITY_API_TOKEN</code>, then reload this page. The schemas
            live in <code>sanity/schemaTypes</code>.
          </p>
        ) : null}

        <FeedbackPanel
          feedback={content.feedback}
          onChange={() => router.refresh()}
        />

        {joystickTypes.map((type) => (
          <CategoryPanel
            key={type.key}
            category={type.key}
            name={type.name}
            videos={content.videos.filter((item) => item.category === type.key)}
            onChange={() => router.refresh()}
          />
        ))}
      </div>
    </main>
  );
}
