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
- Last updated: 2026-09-13, by OpenCode

## 2026-09-14 Implementation Reconciliation

The latest verified implementation has progressed beyond the original project summary. The repository now has MongoDB-backed content/session/event infrastructure, deterministic pool-first gameplay data, Phaser integration for Addition/Subtraction, an AI abstraction, five registered agents with task/run/event persistence, retryable queue behavior, admin authentication, protected admin APIs, admin command-center baseline, and Docker/Nginx deployment support.

The Parent Experience is an approved architectural direction but is not yet verified as implemented. It should be introduced through a secure parent-child relationship rather than name/age matching.

The current session evidence verifies Addition and Subtraction gameplay strongly; do not infer completion of Clean Up, Picture Puzzle, or Shadow Sketch from the roadmap alone.
