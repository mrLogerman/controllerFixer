import Image from "next/image";
import { Camera, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/testimonials";

export type FeedbackCardVariant = 1 | 2 | 3 | 4 | 5 | 6;

function Photo({
  testimonial,
  className,
  rounded,
  dark = false,
}: {
  testimonial: Testimonial;
  className?: string;
  rounded?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        rounded,
        dark ? "bg-[#1b1c18]" : "bg-[#e4e5df]",
        className,
      )}
    >
      {testimonial.image ? (
        <Image
          src={testimonial.image}
          alt={`${testimonial.name}'s repaired controller`}
          fill
          sizes="(max-width: 640px) 80vw, 470px"
          className="object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-1.5",
            dark ? "text-white/45" : "text-[#8b8d86]",
          )}
        >
          <Camera className="size-6" strokeWidth={1.5} />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em]">
            Photo
          </span>
        </div>
      )}
    </div>
  );
}

function Stars({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex gap-1 text-[#7c5cff]", className)}
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, star) => (
        <Star key={star} className="size-4 fill-current" />
      ))}
    </div>
  );
}

const shell = "h-full overflow-hidden rounded-3xl border border-[#d4d5cf] bg-white";
const quoteText = "font-display font-semibold tracking-[-0.02em]";

function AvatarTop({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "flex flex-col p-7")}>
      <div className="flex items-center gap-4">
        <Photo
          testimonial={testimonial}
          className="size-16"
          rounded="rounded-full"
        />
        <div>
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="mt-1 text-xs text-[#777a73]">{testimonial.repair}</p>
        </div>
      </div>
      <Stars className="mt-6" />
      <blockquote className={cn(quoteText, "mt-4 text-xl leading-8")}>
        “{testimonial.quote}”
      </blockquote>
    </figure>
  );
}

function PhotoLeft({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "flex")}>
      <Photo testimonial={testimonial} className="w-2/5" />
      <div className="flex flex-1 flex-col p-6">
        <Stars />
        <blockquote className={cn(quoteText, "mt-4 text-lg leading-7")}>
          “{testimonial.quote}”
        </blockquote>
        <figcaption className="mt-auto pt-5">
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="mt-1 text-xs text-[#777a73]">{testimonial.repair}</p>
        </figcaption>
      </div>
    </figure>
  );
}

function PhotoBanner({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "flex flex-col")}>
      <Photo testimonial={testimonial} className="h-44 w-full" />
      <div className="flex flex-1 flex-col p-7">
        <Stars />
        <blockquote className={cn(quoteText, "mt-4 text-xl leading-8")}>
          “{testimonial.quote}”
        </blockquote>
        <figcaption className="mt-auto border-t border-[#e3e4df] pt-5">
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="mt-1 text-xs text-[#777a73]">{testimonial.repair}</p>
        </figcaption>
      </div>
    </figure>
  );
}

function PhotoOverlay({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "relative min-h-[380px] border-transparent")}>
      <Photo
        testimonial={testimonial}
        dark
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0b] via-[#0c0d0b]/75 to-[#0c0d0b]/10" />
      <div className="relative flex h-full flex-col justify-end p-7 text-white">
        <Quote className="size-7 text-[#b6ff2e]" />
        <blockquote className={cn(quoteText, "mt-4 text-xl leading-8")}>
          “{testimonial.quote}”
        </blockquote>
        <figcaption className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
          <div>
            <p className="text-sm font-bold">{testimonial.name}</p>
            <p className="mt-1 text-xs text-white/55">{testimonial.repair}</p>
          </div>
          <Stars className="text-[#b6ff2e]" />
        </figcaption>
      </div>
    </figure>
  );
}

function PhotoFooter({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "flex flex-col")}>
      <div className="p-7">
        <Stars />
        <blockquote className={cn(quoteText, "mt-4 text-xl leading-8")}>
          “{testimonial.quote}”
        </blockquote>
      </div>
      <div className="relative mt-auto h-40">
        <Photo
          testimonial={testimonial}
          dark
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0b]/90 to-transparent" />
        <figcaption className="absolute inset-x-6 bottom-5 text-white">
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="mt-1 text-xs text-white/65">{testimonial.repair}</p>
        </figcaption>
      </div>
    </figure>
  );
}

function PhotoThumb({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={cn(shell, "flex flex-col p-7")}>
      <div className="flex items-start justify-between gap-4">
        <Stars />
        <span className="rounded-full bg-[#b6ff2e] px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.12em]">
          Verified fix
        </span>
      </div>
      <blockquote className={cn(quoteText, "mt-5 text-xl leading-8")}>
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-4 border-t border-[#e3e4df] pt-5">
        <Photo
          testimonial={testimonial}
          className="size-14"
          rounded="rounded-xl"
        />
        <div>
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="mt-1 text-xs text-[#777a73]">{testimonial.repair}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export const feedbackCardOptions = [
  { variant: 1 as const, name: "Round avatar on top", component: AvatarTop },
  { variant: 2 as const, name: "Photo beside the quote", component: PhotoLeft },
  { variant: 3 as const, name: "Photo banner above", component: PhotoBanner },
  { variant: 4 as const, name: "Full photo with overlay", component: PhotoOverlay },
  { variant: 5 as const, name: "Photo footer strip", component: PhotoFooter },
  { variant: 6 as const, name: "Small photo in footer", component: PhotoThumb },
];

export function FeedbackCard({
  testimonial,
  variant,
}: {
  testimonial: Testimonial;
  variant: FeedbackCardVariant;
}) {
  const option =
    feedbackCardOptions.find((entry) => entry.variant === variant) ??
    feedbackCardOptions[0];
  const Card = option.component;

  return <Card testimonial={testimonial} />;
}
