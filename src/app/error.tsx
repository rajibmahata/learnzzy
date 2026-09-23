"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@/lib/sentry";

// Child-safe error screen (docs/UI_UX.md §25). Never show stack traces,
// API codes, or technical copy to a child.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { boundary: "app/error" });
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <p aria-hidden className="text-6xl">
        😊
      </p>
      <h1 className="text-headline-md font-extrabold text-on-surface">Oops! Let&apos;s try again.</h1>
      <p className="max-w-sm text-base font-bold text-on-surface-variant">
        A little adventure got stuck. Nothing you did — tap below and we&apos;ll keep playing.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="tactile-button min-h-touch-lg rounded-full bg-primary px-6 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#004395]"
        >
          TRY AGAIN
        </button>
        <Link
          href="/play"
          className="tactile-button flex min-h-touch items-center justify-center rounded-full bg-white px-6 py-3 text-base font-extrabold text-on-surface shadow-[0_4px_0_#d5e3fc]"
        >
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
