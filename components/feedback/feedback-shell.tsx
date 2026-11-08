import Link from "next/link";
import { Logo } from "@/components/logo";

export function FeedbackShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100svh] bg-[#f4f4f1] px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" aria-label="Vancouver Controller Repair — home">
          <Logo />
        </Link>
        <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgb(16_17_15/0.06)] sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
