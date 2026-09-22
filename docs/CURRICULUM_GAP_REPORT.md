# Curriculum Gap Report — Measurable, not “looks complete”
Generated: 2026-09-22 via `calculateCoverage()` + `gapReport()`

**Coverage:** 4 outcomes, 4 mapped (100% for registered subset), 7 frameworks

**Missing Frameworks:** `common-core (US)` `DATA_REQUIRED`, `australian` `DATA_REQUIRED`, `uk-national` `DATA_REQUIRED`, `singapore` `DATA_REQUIRED`, `maharashtra-state` `DATA_REQUIRED`

**Missing Stages:** `cambridge-primary-2` (Stage 2, 6-7) no outcomes yet, `ib-pyp 6-12` not yet imported

**Missing Subjects:** `Cambridge Science, Computing, Art & Design, Music, PE, Wellbeing` (framework has subjects, outcomes not yet imported — 0% for those subjects)

**Missing Outcomes:** `cambridge-science-1` `DATA_REQUIRED`, `ncert-math-place-value` `DATA_REQUIRED`

**Missing Skills:** `multiplication`, `division`, `geometry`, `measurement`, `time` — no activity with those skills in `LEARNING_ACTIVITY_REGISTRY`

**Missing Activity Types:** `Virtual Lab, Experiment Simulator, Music Rhythm` (mechanics exist but no curriculum-mapped activity)

**Missing Levels:** `addition` has 8/8, `color-recognition` 7/7, but `phonics` only 5/8, `life-cycles` 1/8

**Missing Assessments:** `knowledge-check-numbers/words` cover `addition/phonics` but `science observation` no assessment activity

**Missing Translations:** `Marathi, Gujarati, Kannada` locale files absent (only en/hi/bn/ta/te)

**Missing Accessibility:** `Balloon pop` has `reducedMotion` but `Robot Path` keyboard-only not yet tested

**Missing Safety Validation:** `ext-ocean-wonders` `curated-external` approved but `parentApprovalRequired` UI not yet wired in `/admin/curriculum/validation`

**Action:** Each `DATA_REQUIRED` explicitly marks not fabricated; add framework JSON to `curriculum/frameworks/` to close.
