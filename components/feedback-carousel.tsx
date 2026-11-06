"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Cards live on an endless ring, so there is no first or last.
const SIDE_CARDS = 2;
const WHEEL_THRESHOLD = 24;
const SWIPE_THRESHOLD = 40;

export function FeedbackCarousel<T>({
  items,
  renderItem,
  label,
  autoAdvanceMs,
  className,
}: {
  items: readonly T[];
  renderItem: (item: T, focused: boolean) => ReactNode;
  label?: string;
  autoAdvanceMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [step, setStep] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const pausedRef = useRef(false);

  const move = useCallback((delta: 1 | -1) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setDirection(delta);
  }, []);

  function commitMove() {
    if (direction === 0) return;

    setIndex((current) => current + direction);
    setDirection(0);
    busyRef.current = false;
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const card = track.firstElementChild as HTMLElement | null;
      if (!card) return;

      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      setStep(card.getBoundingClientRect().width + gap);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let wheelDelta = 0;

    function handleWheel(event: WheelEvent) {
      const raw =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (raw === 0) return;

      event.preventDefault();
      if (busyRef.current) return;

      wheelDelta += event.deltaMode === 1 ? raw * 40 : raw;
      if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;

      move(wheelDelta > 0 ? 1 : -1);
      wheelDelta = 0;
    }

    let startX: number | null = null;

    function handlePointerDown(event: PointerEvent) {
      startX = event.clientX;
    }

    function handlePointerUp(event: PointerEvent) {
      if (startX === null) return;

      const travelled = event.clientX - startX;
      startX = null;
      if (Math.abs(travelled) < SWIPE_THRESHOLD) return;

      move(travelled < 0 ? 1 : -1);
    }

    frame.addEventListener("wheel", handleWheel, { passive: false });
    frame.addEventListener("pointerdown", handlePointerDown);
    frame.addEventListener("pointerup", handlePointerUp);
    frame.addEventListener("pointercancel", handlePointerUp);

    return () => {
      frame.removeEventListener("wheel", handleWheel);
      frame.removeEventListener("pointerdown", handlePointerDown);
      frame.removeEventListener("pointerup", handlePointerUp);
      frame.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [move]);

  useEffect(() => {
    if (!autoAdvanceMs) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (!pausedRef.current) move(1);
    }, autoAdvanceMs);

    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, move]);

  const cards = Array.from(
    { length: SIDE_CARDS * 2 + 1 },
    (_, position) => position - SIDE_CARDS,
  ).map((offset) => {
    const slot = index + offset;
    const wrapped = ((slot % items.length) + items.length) % items.length;

    return { slot, item: items[wrapped], focused: offset === 0 };
  });

  return (
    <div
      ref={frameRef}
      role="group"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") move(1);
        if (event.key === "ArrowLeft") move(-1);
      }}
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
      className={cn(
        "relative left-1/2 flex w-screen -translate-x-1/2 cursor-grab justify-center overflow-hidden py-6 outline-none",
        className,
      )}
    >
      <motion.div
        ref={trackRef}
        className="flex w-max shrink-0 items-stretch gap-4 sm:gap-6"
        animate={{ x: -direction * step }}
        transition={
          direction === 0
            ? { duration: 0 }
            : { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }
        }
        onAnimationComplete={commitMove}
      >
        {cards.map(({ slot, item, focused }) => (
          <div
            key={slot}
            aria-hidden={!focused}
            className={cn(
              "carousel-card shrink-0 origin-center transition-all duration-300",
              focused ? "scale-[1.04] opacity-100" : "scale-[0.88] opacity-45",
            )}
          >
            {renderItem(item, focused)}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
