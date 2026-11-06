import { cn } from "@/lib/utils";

// "light" sits on the dark hero, "dark" sits on the pale footer.
type LogoTone = "light" | "dark";

export function LogoMark({
  tone = "dark",
  className,
}: {
  tone?: LogoTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display inline-flex items-center justify-center rounded-xl px-2.5 py-1.5 text-[0.95rem] font-extrabold leading-none tracking-[0.02em]",
        tone === "light"
          ? "bg-[#b6ff2e] text-[#11120f]"
          : "bg-[#171815] text-[#b6ff2e]",
        className,
      )}
    >
      VCR
    </span>
  );
}

export function Logo({
  tone = "dark",
  className,
}: {
  tone?: LogoTone;
  className?: string;
}) {
  const onDark = tone === "light";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} />
      <span className="leading-none">
        <span
          className={cn(
            "block text-[0.55rem] font-bold uppercase tracking-[0.26em]",
            onDark ? "text-white/55" : "text-[#83857e]",
          )}
        >
          Vancouver
        </span>
        <span
          className={cn(
            "font-display mt-1.5 block text-[0.95rem] font-bold uppercase tracking-[0.01em] sm:text-[1.05rem]",
            onDark ? "text-white" : "text-[#10110f]",
          )}
        >
          Controller{" "}
          <span className={onDark ? "text-[#b6ff2e]" : "text-[#70736b]"}>
            Repair
          </span>
        </span>
      </span>
    </span>
  );
}
