"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@/lib/sentry";

export default function PlayError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { boundary: "play/error" });
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <p aria-hidden className="text-6xl">
        😊
      </p>
      <h1 className="text-headline-md font-extrabold">Oops! Let&apos;s try again.</h1>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="tactile-button min-h-touch-lg rounded-full bg-primary px-6 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#004395]"
        >
          TRY AGAIN
        </button>
        <Link href="/play" className="tactile-button flex min-h-touch items-center justify-center rounded-full bg-white px-6 py-3 font-extrabold shadow-[0_4px_0_#d5e3fc]">
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
