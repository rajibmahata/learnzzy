"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LearnerSetup } from "@/components/learner/LearnerSetup";
import { ChildSelector } from "@/components/learner/ChildSelector";
import { getActiveLearnerId, listDeviceLearners, type DeviceLearner } from "@/lib/learner";

function sanitizeNext(raw: string | null): string {
  if (!raw) return "/play";
  // Only allow internal play/learn routes to prevent open redirect.
  if (raw.startsWith("/play") || raw.startsWith("/learn")) return raw;
  return "/play";
}

function WelcomeContent() {
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [ready, setReady] = React.useState(false);
  const [learners, setLearners] = React.useState<DeviceLearner[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    setLearners(listDeviceLearners());
    setActiveId(getActiveLearnerId());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <p role="status" className="safe-panel p-8 text-center">Getting ready… ✨</p>
      </div>
    );
  }
  if (learners.length > 0 && !adding) {
    return <ChildSelector learners={learners} activeId={activeId} next={next} onAdd={() => setAdding(true)} />;
  }
  return <LearnerSetup next={next} />;
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4"><p role="status" className="safe-panel p-8 text-center">Getting ready… ✨</p></div>}>
      <WelcomeContent />
    </Suspense>
  );
}
