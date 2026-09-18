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
- Last updated: 2026-09-18 Session 10, by OpenCode — 189 unit, validated Stitch d14a/4b84, Home Learning World

## 2026-09-18 Stitch Retrieval + Attractiveness Update

Retrieved: Stitch screens 12–20 live (7 HTML + 9 screenshots) + 3 optimized
WebP scene postcards. Restyled: Worlds banner cards, Play Home Pip/Spin,
Addition, Subtraction, Clean Up, Puzzle, Sketch — presentation only.
Verified: 174 unit tests, typecheck, lint, production build, Playwright
child/sketch/discover/adaptive/learning-journey, screenshot review, Docker
image build. Open: live-Mongo E2E (KI-019), TTS binaries (KI-020),
parent-journey screenshot re-fetch, physical devices.

## 2026-09-18 Session 10 — Animal Wonderland Rich + Home Learning World

Validated landing against new Stitch `d14a9b61` (Child-First 3D Play Home) +
`4b8445bd` (ANIMATION_45 Rich) via `curl -L` (`.stitch/...` + `public/images/stitch/home-child-first-v2.png`).
Rich scene: 5 candy mushrooms + 5 bobbing apples + 15 deterministic stars + 4
birds + tap jump burst. Landing now category-primary (hero → CTA →
`HomeContinue` personalized Good-morning + plan card → 7-category grid →
secondary shortcuts → games) per spec §2/§3 while preserving Stitch
hierarchy. `BrandLogo` → `/play`. Bug: `genTraceWrite` `answerIndex: 0` →
`options.indexOf(answer)` with tightened assertions; `resolveComplexity`
dead code removed. Verified: 189 unit (47 suites), `tsc`/`eslint`/`next
build` green.

## 2026-09-17 Academic Engine Update

Added: Academic Orchestrator + Validated Learning Plan (+ 4 learner APIs),
8th `academic-agent`, Voice Character Engine (5×11×5, `voiceAssets` cache),
dynamic visual themes + 5 cross-domain combos, numbers/vocabulary catalog
growth (13 categories), parent academic rollup + streak, admin academic
panel. Verified: 156 unit tests, typecheck, lint, production build
(81 routes). Open: live-Mongo E2E (KI-019), TTS binaries (KI-020),
Playwright academic pass, Stitch validation.

## 2026-09-14 Implementation Reconciliation

The latest verified implementation has progressed beyond the original project summary. The repository now has MongoDB-backed content/session/event infrastructure, deterministic pool-first gameplay data, Phaser integration for Addition/Subtraction, an AI abstraction, five registered agents with task/run/event persistence, retryable queue behavior, admin authentication, protected admin APIs, admin command-center baseline, and Docker/Nginx deployment support.

The Parent Experience is an approved architectural direction but is not yet verified as implemented. It should be introduced through a secure parent-child relationship rather than name/age matching.

The current session evidence verifies Addition and Subtraction gameplay strongly; do not infer completion of Clean Up, Picture Puzzle, or Shadow Sketch from the roadmap alone.
