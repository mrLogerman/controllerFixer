"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(result?.error ?? "Could not sign in.");
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#10110f] px-5 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-[2rem] bg-white p-8"
      >
        <LogoMark tone="dark" />
        <h1 className="font-display mt-6 text-2xl font-semibold tracking-[-0.03em]">
          Staff sign in
        </h1>
        <p className="mt-2 text-sm text-[#73756f]">
          This page manages customer feedback and joystick videos.
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f615b]">
            Password
          </span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Lock className="size-4" />
          )}
          {busy ? "Checking..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
