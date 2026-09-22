# PROJECT: Learnzzy

## Summary
Learnzzy is a child-focused educational games PWA for short, visual, deterministic learning sessions. Children play without accounts, ads, or synchronous AI; administrators manage validated content and an asynchronous agent workforce.

## Goals
- Deliver five fast, safe games for addition, subtraction, observation, spatial reasoning, and tracing.
- Use MongoDB-backed validated content pools and background agents to enrich the world without slowing gameplay.
- Provide a small, auditable admin command center for content, pools, agents, analytics, and system health.

## Non-Goals
- Child social accounts, social features, ads, payments, or open-ended chat. Parent accounts are an approved product direction; child accounts remain minimized and privacy-first.
- LLM-controlled arithmetic, scoring, game state, or per-click interactions.
- Automatic major difficulty changes without administrator approval.

## Stakeholders
- Product owner: Learnzzy product team
- Primary users: children and their caregivers
- Technical owner: Learnzzy engineering

## Constraints
- Gameplay must remain usable when MongoDB, Redis, AI, or asset services are unavailable.
- AI credentials are server-only and generated content is untrusted until validated.
- Local development supports deterministic mock AI and an in-process queue fallback.

## Tech Stack
- Backend: Next.js route handlers, Node.js, Zod
- Frontend: Next.js, React, Tailwind CSS, Phaser 3, PWA shell
- Database: MongoDB; Redis/BullMQ when configured
- Hosting: Docker, Nginx, VPS or equivalent container host

## Links
- Repository: local workspace
- Design files: `docs/stitch_learnzzy_educational_kids_playground/`
- Related projects: none

## Status
- Phase: build / stabilize
- Last updated: 2026-09-19 Session 17, by OpenCode -- 204 unit, Words & Phonics, Global Level Journey + Auto-Next, 3D, Docker MCP

## 2026-09-18 Stitch Retrieval + Attractiveness Update

Retrieved: Stitch screens 12â€“20 live (7 HTML + 9 screenshots) + 3 optimized
WebP scene postcards. Restyled: Worlds banner cards, Play Home Pip/Spin,
Addition, Subtraction, Clean Up, Puzzle, Sketch â€” presentation only.
Verified: 174 unit tests, typecheck, lint, production build, Playwright
child/sketch/discover/adaptive/learning-journey, screenshot review, Docker
image build. Open: live-Mongo E2E (KI-019), TTS binaries (KI-020),
parent-journey screenshot re-fetch, physical devices.

## 2026-09-18 Session 10 â€” Animal Wonderland Rich + Home Learning World

Validated landing against new Stitch `d14a9b61` (Child-First 3D Play Home) +
`4b8445bd` (ANIMATION_45 Rich) via `curl -L` (`.stitch/...` + `public/images/stitch/home-child-first-v2.png`).
Rich scene: 5 candy mushrooms + 5 bobbing apples + 15 deterministic stars + 4
birds + tap jump burst. Landing now category-primary (hero â†’ CTA â†’
`HomeContinue` personalized Good-morning + plan card â†’ 7-category grid â†’
secondary shortcuts â†’ games) per spec Â§2/Â§3 while preserving Stitch
hierarchy. `BrandLogo` â†’ `/play`. Bug: `genTraceWrite` `answerIndex: 0` â†’
`options.indexOf(answer)` with tightened assertions; `resolveComplexity`
dead code removed. Verified: 189 unit (47 suites), `tsc`/`eslint`/`next
build` green.

## 2026-09-18 Session 11 â€” Calm Warm Female Voice

Calm companion: `VoiceScript` (13 events, 5 locales), moderate 0.82â€“0.88,
soft volume 0.85, 900ms thinking gap, 5-locale soft scripts, `CHARACTER_VOICES`
and `STATE_LINES` calm. TTS cached + fallback, never blocks. Verified:
190 unit, `tsc`/`build` green.

## 2026-09-18 Session 12 â€” Organized Wonder Play + Docker-First MCP + Category Hub

`/play` gap closed (18â†’25): added `more-less`, `count-by-tens`,
`trace-number-name`, `matching`, `odd-one-out`, `pattern`, `shape-match` to
`More Adventures`, now grouped by World (Numbers 8, Words 2, Write 3, Think 7,
Shapes 3, Discover&Puzzles 2) + 6 Stitch Category Hub cards (Category Hub
`1b8480cd` gradients/tactile shadows) + `WonderArchipelago3D` (`a1812/9fa2`
`ANIMATION_48`) full-screen wonderland. Docker-first MCP shim (`services/mcp`
unified image, 3 roles, qdrant) on private `learnzzy` network, prod hides
ports, `npm run docker:health`. Stitch `1b8480`, `a1812/9fa2`, `00259/3f852`,
`f66f/38d8/77cc` fetched via `curl -L`. Verified: 190 unit, `tsc`/`docker
compose config` OK, `next build` green.

## 2026-09-18 Session 13 â€” All 25 Validated + Big & Small Fix

`Big & Small` identical visuals fixed: `ActivityContent.visualMeta` + scaled
pills in `ActivityPlayer`; `All Wonder Adventures` 25/25 validated across
`4-5/6-7/8-9` (`one-correct`, `unique`, `index-points-at-answer`,
`visual length`). `GET /api/activities/...` still `globalLevel+mastery`.
Verified: `npm test` 190/190, `npx tsc --noEmit` 0.

## 2026-09-18 Session 14 â€” Global Level + Personalized Session Planner

Single `GLOBAL` level 1..6+ (no per-game visible levels); `skill mastery`
internal (`gameProgress.recentAccuracy` â†’ `evaluateSkill`), `activity
complexity = global + masteryAdj` via `resolveComplexity`; deterministic
`PersonalizedSessionPlanner` (interest+need+variety, top-stays). `buildPlan`
all items `level = globalLevel`, new `GET /api/learners/[id]/session`,
`levelService` global promotion (overall avg + variety). UI now `Global
Level` only. Verified: `npm test` 190/190, `tsc` 0.

## 2026-09-19 Session 16, by OpenCode -- 190 unit, Global Level Journey + Auto-Next, 3D, Docker MCP

Inspected `speechSynthesis`/`getVoices`/`voiceAssetService` â†’ robotic
parametric, no SSML, `voiceAssets` pending (KI-020), `rate/pitch` insufficient.
Decision: server `ttsProvider` (neural warm female) â†’ `voiceAssets.audioUrl`
â†’ `HTMLAudio` preload, `speechSynthesis` fallback only; `VoiceScript`
`pauseAfterMs` will be waited, gameplay never blocks.

## 2026-09-17 Academic Engine Update

Added: Academic Orchestrator + Validated Learning Plan (+ 4 learner APIs),
8th `academic-agent`, Voice Character Engine (5Ã—11Ã—5, `voiceAssets` cache),
dynamic visual themes + 5 cross-domain combos, numbers/vocabulary catalog
growth (13 categories), parent academic rollup + streak, admin academic
panel. Verified: 156 unit tests, typecheck, lint, production build
(81 routes). Open: live-Mongo E2E (KI-019), TTS binaries (KI-020),
Playwright academic pass, Stitch validation.

## 2026-09-14 Implementation Reconciliation

The latest verified implementation has progressed beyond the original project summary. The repository now has MongoDB-backed content/session/event infrastructure, deterministic pool-first gameplay data, Phaser integration for Addition/Subtraction, an AI abstraction, five registered agents with task/run/event persistence, retryable queue behavior, admin authentication, protected admin APIs, admin command-center baseline, and Docker/Nginx deployment support.

The Parent Experience is an approved architectural direction but is not yet verified as implemented. It should be introduced through a secure parent-child relationship rather than name/age matching.

The current session evidence verifies Addition and Subtraction gameplay strongly; do not infer completion of Clean Up, Picture Puzzle, or Shadow Sketch from the roadmap alone.


## 2026-09-19 Session 16 -- Global Level Journey + Auto-Next + Interactive Feedback

ONE GLOBAL Level (1..6) visible as LEVEL N on every exercise (ActivityPlayer, AdditionPlay, SubtractionPlay); no per-game visible levels, skill mastery internal. Exercise flow: Exercise starts -> Child solves -> Server validates -> Correct? SUCCESS (green) : RETRY (red, sad) -> Feedback -> Next enabled -> 10s countdown (progress bar + Next in Xs) -> Automatic next (setTimeout 10000, cancel on manual). Implemented countdown state + useEffect + cancel. Complexity: GLOBAL + AGE BAND + PERFORMANCE + SKILL MASTERY + INTEREST + RECENT -> Activity Complexity with age-band boundaries (4-5 simple, 6-7 intermediate, 8-9 advanced) and MCP advisory (Tutor via Gateway, 800ms timeout, 7 validations: schema, age-band, global-level, skill, bounds, game capability, safety, fallback). MCP failure never blocks child. Verified: npm test 190/190, tsc 0.

## 2026-09-19 Session 17 -- Words & Phonics First-Class Track

Words & Phonics now runs through the existing category, registry, content API,
adaptive complexity, event, academic-result, voice, and `ActivityPlayer` paths.
`src/lib/words.ts` owns 15 seeded word families and age-band rules. Seven
activities are available: word family/missing letter, picture match, jumble,
builder, family sorting, listening, and rhyme discovery. Five new deterministic
generators and three renderer kinds (`build-order`, `sort-choice`, and
`listen-choice`) were added without creating a separate game engine. `/play`
now exposes all 30 registered activities. Verified: 204/204 unit tests,
typecheck, lint, production build, and focused mobile-320 Playwright Words
coverage 4/4. Full `/play` E2E load timing remains an environment issue.
