"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

// The thumbnail stands in until someone hits play, so YouTube's player (and its
// cookies) only load when a visitor actually asks for the video.
export function YouTubeEmbed({
  videoId,
  title,
  className,
}: {
  videoId?: string;
  title: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  const frame = cn(
    "relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101109]",
    className,
  );

  if (!videoId) {
    return (
      <div className={frame}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/45">
          <Play className="size-9" strokeWidth={1.4} />
          <p className="text-xs font-bold uppercase tracking-[0.14em]">
            Video coming soon
          </p>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={frame}>
        <iframe
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={cn(frame, "group cursor-pointer")}
    >
      <Image
        // hqdefault exists for every video; maxresdefault often does not.
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 560px"
        className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#b6ff2e] text-[#11120f] shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 size-7 fill-current" />
        </span>
      </span>
    </button>
  );
}
