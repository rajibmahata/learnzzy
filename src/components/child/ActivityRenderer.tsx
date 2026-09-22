"use client";

import * as React from "react";
import type { MissionResponse, MissionStep } from "@/lib/missionEngine";

interface ActivityRendererProps {
  step: MissionStep;
  disabled?: boolean;
  hintIndex?: number;
  onSubmit: (response: MissionResponse, evidence?: Record<string, unknown>) => void;
}

export function ActivityRenderer({ step, disabled = false, hintIndex = 0, onSubmit }: ActivityRendererProps) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [built, setBuilt] = React.useState<number[]>([]);
  const [groups, setGroups] = React.useState<Record<string, string>>({});
  const [freeText, setFreeText] = React.useState("");
  const [strategy, setStrategy] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelected(null);
    setBuilt([]);
    setGroups({});
    setFreeText("");
    setStrategy(null);
  }, [step.stepId]);

  const content = step.content;
  const visual = content.visual ?? [];
  const options = content.options ?? [];
  const letters = content.letters ?? [];
  const strategyOptions = content.strategyOptions ?? [];

  function withStrategy(extra: Record<string, unknown>): Record<string, unknown> {
    return strategy ? { ...extra, strategyUsed: strategy } : extra;
  }

  function submitChoice(value: string) {
    if (disabled) return;
    setSelected(value);
    onSubmit(value, withStrategy({ interaction: "choice", selected: value }));
  }

  function submitGroups() {
    if (disabled) return;
    const response = Object.entries(groups).map(([item, group]) => `${item}:${group}`);
    onSubmit(response, withStrategy({ interaction: "sort", assignments: groups, elementsUsed: Object.keys(groups).length }));
  }

  function tapLetter(index: number) {
    if (disabled || built.includes(index)) return;
    const next = [...built, index];
    setBuilt(next);
  }

  function submitWord() {
    if (disabled || built.length !== letters.length) return;
    const response = built.map((index) => letters[index]).join("");
    onSubmit(response, withStrategy({ interaction: "build_word", elementsUsed: built.length, variationCreated: response }));
  }

  function submitOpenEnded() {
    if (disabled || !freeText.trim()) return;
    onSubmit(freeText.trim(), withStrategy({ interaction: step.type, completed: true, elementsUsed: freeText.trim().split(/\s+/).length, variationCreated: freeText.trim() }));
  }

  const showVisual = visual.length > 0 || Boolean(content.memoryItems?.length);
  return (
    <div className="mt-4 flex flex-col gap-3">
      {showVisual && (
        <div aria-label={content.visualLabel ?? "mission clues"} className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-surface-low p-4">
          {(content.memoryItems ?? visual).map((item, index) => (
            <span key={`${item}-${index}`} aria-hidden className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-white px-3 text-4xl shadow-sm">
              {item}
            </span>
          ))}
        </div>
      )}

      {strategyOptions.length > 0 && (
        <div role="group" aria-label="Choose your trying idea" className="flex flex-col gap-2 rounded-2xl bg-surface-low p-3">
          <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">How will you try it?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {strategyOptions.map((option) => (
              <button
                key={option}
                type="button"
                disabled={disabled}
                aria-pressed={strategy === option}
                onClick={() => setStrategy((current) => (current === option ? null : option))}
                className={`tactile min-h-11 rounded-full px-3 py-2 text-sm font-bold ${strategy === option ? "bg-secondary text-white" : "bg-white shadow-[0_3px_0_#d5e3fc]"} disabled:opacity-60`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.type === "sort" ? (
        <div className="flex flex-col gap-3" role="group" aria-label="Sort items into groups">
          {visual.map((item) => (
            <div key={item} className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-surface-low p-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl">{item}</span>
              {(content.groups ?? options).map((group) => (
                <button
                  key={`${item}-${group}`}
                  type="button"
                  disabled={disabled}
                  aria-label={`${item} in ${group}`}
                  onClick={() => setGroups((current) => ({ ...current, [item]: group }))}
                  className={`tactile min-h-11 rounded-full px-3 py-2 text-sm font-bold ${groups[item] === group ? "bg-primary text-white" : "bg-white shadow-[0_3px_0_#d5e3fc]"}`}
                >
                  {group}
                </button>
              ))}
            </div>
          ))}
          <button type="button" disabled={disabled || Object.keys(groups).length !== visual.length} onClick={submitGroups} className="tactile-button self-center bg-primary px-6 py-3 text-white disabled:opacity-50">
            Check groups
          </button>
        </div>
      ) : step.type === "build_word" ? (
        <div className="flex flex-col gap-3">
          <div aria-label="Word being built" className="flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl bg-surface-low p-3">
            {Array.from({ length: letters.length }, (_, index) => {
              const letterIndex = built[index];
              return <span key={index} className="flex h-14 min-w-12 items-center justify-center rounded-2xl border-2 border-dashed border-outline bg-white text-2xl font-black">{letterIndex === undefined ? "·" : letters[letterIndex].toUpperCase()}</span>;
            })}
          </div>
          <div role="group" aria-label="Letter choices" className="flex flex-wrap justify-center gap-2">
            {letters.map((letter, index) => (
              <button key={`${letter}-${index}`} type="button" disabled={disabled || built.includes(index)} onClick={() => tapLetter(index)} aria-label={`Letter ${letter}`} className="tactile flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black shadow-[0_4px_0_#d5e3fc] disabled:opacity-40">
                {letter.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <button type="button" disabled={disabled || built.length === 0} onClick={() => setBuilt([])} className="tactile rounded-full bg-surface-high px-4 py-2 font-bold disabled:opacity-50">Clear</button>
            <button type="button" disabled={disabled || built.length !== letters.length} onClick={submitWord} className="tactile-button bg-primary px-5 py-2 text-white disabled:opacity-50">Check word</button>
          </div>
        </div>
      ) : step.type === "draw" || step.type === "create" || step.type === "trace" ? (
        <div className="flex flex-col gap-2">
          <textarea aria-label="Your creation" value={freeText} onChange={(event) => setFreeText(event.target.value)} disabled={disabled} rows={3} className="w-full rounded-2xl border-2 border-outline bg-white p-3 text-base" placeholder="Tell or draw your idea here…" />
          <button type="button" disabled={disabled || !freeText.trim()} onClick={submitOpenEnded} className="tactile-button self-center bg-primary px-6 py-3 text-white disabled:opacity-50">I’m finished</button>
        </div>
      ) : (
        <div role="group" aria-label="Mission choices" className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button key={option} type="button" disabled={disabled} onClick={() => submitChoice(option)} aria-label={`Choice ${option}`} className={`tactile min-h-14 rounded-2xl bg-white px-3 py-3 text-answer shadow-[0_4px_0_#d5e3fc] ${selected === option ? "ring-4 ring-primary-fixed" : ""} disabled:opacity-60`}>
              {option}
            </button>
          ))}
        </div>
      )}

      {hintIndex > 0 && step.hints[hintIndex - 1] && <p className="rounded-xl bg-amber-50 p-3 text-sm">💡 {step.hints[hintIndex - 1]}</p>}
    </div>
  );
}
