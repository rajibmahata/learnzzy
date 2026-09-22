# CHANGELOG: Learnzzy

## [Unreleased]

### Added
- Child identity & resume: `learnzzy.activeLearnerId` canonical pointer, per-device learner list, `ChildSelector` ("Who's playing today?") on `/welcome`, welcome-back home greeting, per-learner session ids, `learnerId` on every game event with session binding (`CHILD_SESSION.md`).
- Server-authoritative unique sticker rewards: ~50-emoji catalog in 8 categories (`src/lib/stickers.ts`), `POST .../rewards/claim` with unique-claim idempotency and `$addToSet` uniqueness, progress `completionId` dedup, derived milestones (5/10/25/50), per-learner cache with server hydration, reconcile wired through all 6 games + generic activities + missions, server-backed Sticker Garden, parent recent achievement (`REWARD_SYSTEM.md`, `STICKER_SYSTEM.md`).
- Celebration consistency: per-character praise, calm non-blocking voice, `prefers-reduced-motion` support, milestone/count display; same congratulations across games, activities, missions.
- Unified "Great job!" success + balloon burst everywhere: all 6 games, Discovery World, generic activities, and missions share one success heading and a lightweight CSS balloon burst on correct answers and completions (reduced-motion safe).
- Welcome name ideas: tappable name chips on the registration screen for children who prefer tapping to typing (names stay display-only).
- Name and buddy split: the explorer-buddy picker no longer overwrites the typed name; `avatar` persists on the learner doc, cached profile, device list, and child selector.
- Single-page child onboarding: one scrollable welcome with progressive unlock (name → nickname (+ideas) → companion (10 roster friends incl. new fox/panda/butterfly/lion) + name → age → optional parent link → Let's Go), one guarded create, one-time first-adventure sticker (`CHILD_ONBOARDING.md`).
- Learner identity model: `displayName`, `nickname` fallback greeting, `companion {characterId, displayName}`, `onboarding` state; `PATCH /api/learners/[id]` for child-safe fields only — `learnerId` stays stable, ageBand never patchable (`LEARNER_IDENTITY.md`, `PARENT_LINK.md`, `SESSION_MODEL.md`).
- Parent children show name, nickname, and companion; returning-home greeting names the companion ("Coco is waiting!").
- Companion reactions: deterministic praise rotation (lines, expressions, calm voice drift, effects) with no LLM in gameplay; onboarding companion leads missions; all 12 characters have calm voice presets.
- Picture Puzzle guidance: WHAT/WHERE/HOW coach strip plus home/tray zone captions; validation and challenge unchanged.
- Picture Puzzle clarity + levels: selection ring, pulsing homes, placed-glow (reduced-motion safe), global-level difficulty 4/6/9 pieces with LEVEL badge, live piece progress, per-placement praise, per-picture "Great job!".
- Fix Learnzzy Session / Welcome / Game Navigation (2026-09-20): Home → Welcome → Play → game now preserves selected `gameId` via `?next=` (sanitized to internal `/play`/`/learn` only); `/welcome` reads `next` with `Suspense` and passes it to `ChildSelector`/`LearnerSetup`; fixed `ChildSelector` Continue bug (`router.push("/")` → `router.push(next)`); `LearnerSetup` now navigates to `next` after creation (shared guarded create); `HomeContinue` also routes via welcome; session isolation via authoritative `learnerId`/`activeLearnerId` with no default player fallback; footer and all Home game entry points updated.
- Unified Game Progression, Feedback & Celebration (2026-09-20): shared `GameResult` (`CORRECT/INCORRECT/COMPLETED`) + `createRoundTransition` guard (`idle→feedback→advancing→done` rejecting double taps and `Next` before `feedback`); `useRoundStatus` hook (single timer + `countdown` + `advanceNow` race-safe); per-game skill levels via `useSkillLevel` (not forced global) with `LEVEL {skill}` badge + difficulty `ceil(level/2)` so 5- and 8-year-olds get different challenges at same global; `RoundFeedback` (one green/red banner shape) replaces 4 different UIs; `Celebration` now shows `Level X ✓ Completed ↓ Level Y ★ Next` or `keep practicing`; `learnerSync` returns `{claim, promotion, skill}` and caches `gameLevels` locally; integrated into all 6 core games (Addition/Subtraction/Clean Up/Puzzle/Sketch/Discovery) + `ActivityPlayer`/`MissionPlayer` use same `GameResult` contract with server `completionId`/`claimId` idempotency and `maybeAdjustSkill` (3 @80%+ promote, 5 @<50% ease).
- Home game cards: image box + title/desc now both link via `/welcome?next=` (previously only the small `Play Now` button did), so tapping the picture starts the game through the same Welcome → Play flow.
- Discovery World: right/wrong now both use shared `RoundFeedback` (green `Great job!` + balloon + `happy` vs red `Try again!` + `encouraging`), same as all other games, so children are consistently excited.
- Child-Friendly Voice (2026-09-20): inspected `voice.ts`/`audio.ts`/`voiceAssetService` — no provider, one generic adult `speechSynthesis` voice everywhere. Replaced with 9 child-friendly `COMPANION_CHILD` profiles (Bunny 1.18/0.92 … Butterfly 1.22/0.96), child-voice-first selection, pitch clamp `1.35` + `playCompanionSound` (Web Audio chime/pop/twinkle per companion) triggered via `speakWithCharacter(..., {characterId})`, and more playful `companion.ts` drift (`±0.025 rate / ±0.04 pitch`). All 6 games + `Celebration`/`MissionPlayer` now pass `characterId` so the sound is friend-specific. Test bounds updated to `1.05–1.28`.
- Child-First Adaptive Engine — audit + feature-flagged extension (2026-09-20): full repository audit (frontend/backend/DB/game flow/selection/difficulty/play data/personalization/voice/reward/agent/MCP) per ABSOLUTE PROTECTION RULE; no logic deleted. Extended `LearnerDoc.gameProgress` with `recentResponseTime/Attempts` + `learningBehavior` + `voicePreference` (all optional, additive), `GameResult`/`ProgressSchema` with `responseTimeMs/attempts/theme/character`, `skillLevels` with hint/RT-aware promotion, `personalizedSessionPlanner` with `+engagementBoost+noveltyBoost+explainability` behind `ADAPTIVE_ENGINE_ENABLED=false` (default preserves existing `interest+need+masteryGap` scoring), and `learnerSync` to return `{claim,promotion,skill}`. Existing behavior preserved when flag `false`; QA with ephemeral learner (flag `true` → hinty/slow stabilizes, flag `false` → old scoring) `typecheck`/`248/248`/`build` green.
- Living Reward World (2026-09-21): additive `src/lib/worldRewards.ts` with 53 data-driven `WorldRewardEvent` configs covering every sticker category (jungle walk `rex🦖/lion/elephant`, ocean sail `boat⛵/dolphin/waterfall`, sky fly `butterfly/bird/dragon`, garden grow `sunflower/tree/apple`, space launch `rocket/planet`, magical `rainbow/unicorn/castle` etc.) + smart category fallback that keeps the child's actual `emoji`; `src/components/child/WorldReward.tsx` full-viewport cinematic (`fixed inset-0`, environment gradients, RIGHT→LEFT walk/sail/fly `translateX±55vw` with scale/dust/waves/sparkles, `prefers-reduced-motion` safe, 3–8s, `CharacterGuide` curious→surprised→celebrating + `praiseFor` + child-friendly voice), integrated into all 6 plays (`addition/subtraction/clean-up/puzzle/sketch/discover`) + `MissionPlayer` (keeps `Celebration` as fallback), `stickers.ts` `rex` added, `personalizedSessionPlanner` now gently boosts `learningThemes/gameAffinity` from owned world rewards (`worldBoost ≤0.35`), `tests/worldRewards.test.ts` 6 tests. Verified `typecheck`/`254/254`/`build` green, no second reward system, server claim still authoritative.
- Stitch Game Section — Number Adventure & Fly Away (2026-09-22): fetched Stitch project `1495487808742926612` screens `ff9f32f8720b4cd79c61ae60c0ee43dd` (Number Adventure — Addition) + `1120c83d47414ff09ad1245b5b84998c` (Fly Away — Subtraction) via `stitch_get_screen` + `curl.exe -L` to `.stitch/1495487808742926612/{id}/screen.html` + `screenshot.png` (780×1768 mobile). Restyled `src/app/play/addition/AdditionPlay.tsx` + `src/app/play/subtraction/SubtractionPlay.tsx` to Stitch visuals while keeping deterministic `useGameRounds`/`additionGame.validate`/`subtractionGame.validate`/`reportGameCompletion`/`WorldReward`: addition — quest sub-header (home + `Number Adventure` pill + stars + `LEVEL`), stepper trail (`check`/active `2`/pending/`lock`), `COUNT THEM!` prompt + `Read aloud`, two `bg-surface-container-lowest` apple groups with count badges + pulsating `add` plus + `arrow_downward` + tactile 4-pad answer grid (`h-20` `shadow-[0_6px_0_#d5e3fc]`, correct `bg-tertiary-fixed`), feedback bar (`lightbulb` + `star`) + **prominent Next** (`w-full h-14 rounded-full bg-primary shadow-[0_5px_0_#004395]` → `Next Level →` / `Complete Level 🎉` + progress `h-2` + `LEVEL • Round X of 5`); subtraction — `Sunny Meadow` stage (`primary-fixed` gradient, `Sunny Sky` chip, `↗ −2 Flew Away` pill, dashed flight trails SVG, `Bye bye! 💨` bouncing birds, wooden perch `bg-secondary` with numbered remaining birds + `Still Perched!` bubble, math strip `5 Birds − 2 Flew = ?`, 4-pad grid with `birds` labels, encouragement footer `touch_app +1 Star`) + same **prominent Next Level** (progress + `arrow_forward`, cancels 10s auto-next on tap). Verified `typecheck`/`254/254`.
- Game Complete — Try Again → Continue Harder (2026-09-22): on `done` with `isTryAgain = mistakeRounds.size > 0`, `AdditionPlay` + `SubtractionPlay` now show an explicit **Continue** that redirects to the next level and makes the game harder. `src/components/child/WorldReward.tsx` extended with `continueLabel?: string` (renders `continueLabel ?? "Continue →"`). `handleContinueHarder` bumps `GLOBAL LEVEL` (`Math.min(6, prev+1)`, persisted to `learnzzy.learner.v1.level` + `learnzzy.globalLevel.v1`), clears `mistakeRounds`/`hintOpens`, resets `round/picked/feedback/done/reward` and `reload()`s with `difficulty = ceil(globalLevel/2)` → strictly harder numbers/birds. `WorldReward` shows `Continue — Try Harder 💪` on retry vs `Continue → Next Level` on success; `Celebration` fallback shows `Good try! Keep going!` + fixed bottom `Continue` (`LEVEL {n} → {n+1} • Harder!`). Preserves `WorldReward` full-viewport cinematic and `Celebration` `prefers-reduced-motion`/`isSoundMuted`.
- Dynamic Non-Monotonous Learning Engine — Phase 2 & 3 (2026-09-22): scalable `src/lib/learningWorlds.ts` 15 worlds (`colors,animals,birds,insects,nature,dinosaurs,ocean,words,numbers,thinking,creative,robots,fruits,space,stories`) each `mechanics[]` distinct; `src/lib/learningActivities.ts` `LearningActivity {id,type:GAME|MISSION|DISCOVERY|STORY|CREATIVE|EXTERNAL_STORY, world, category, skill, ageBands, difficulty, mechanics, theme, estimatedDuration, rewardTags, safetyStatus, provenance}` Zod + `LEARNING_ACTIVITY_REGISTRY` (`ACTIVITY_REGISTRY` → `legacyToLearning` + 9 representative: `color-detective, animal-safari, butterfly-garden, memory-mission, rex-color-adventure STORY, robot-path, fruit-sorting, draw-a-monster CREATIVE, ext-ocean-wonders` + 6 addition variants `balloon-pop-addition, dinosaur-eggs, fruit-basket-addition, rocket-fuel, bee-garden-count, treasure-hunt` — same skill `addition` via different `mechanic/world/theme` per §2); `src/lib/activityVarietyEngine.ts` `repetitionPenalty` recency-weighted + `isBoringRepeat` (3-in-a-row same world/mechanic) + `varietyJitter`; `src/lib/learningAdventureEngine.ts` `recommendNextActivity({learnerId,ageBand,globalLevel,skill,recentPerformance,recentMistakes,completed/abandoned,recent fingerprints/gameTypes/mechanics/themes,interests,unlockedRewardIds,contentAvailability,cognitiveLoad})` scores `interest+need+masteryGap - varietyPenalty - boringExtra - cognitive + worldBoost≤0.35 + recentMistakeBoost + struggleBoost + jitter`, `EXTERNAL_STORY` only when `approved`, `recommendNextActivitySafe` fallback; `src/lib/activitySelector.ts` `selectNextAdventureActivity` + `selectHomeAdventures` (3, world-varied); `src/lib/dynamicActivityEngine.ts` `chooseDynamicActivity` (activity+mechanic+theme+environment+difficulty+content+reward+celebration) picks `environment` via `worldToEnv` avoiding immediate repeat (`Jungle/Ocean/Space/Garden/Farm/Dinosaur Valley/Rainbow Sky` etc.), `mechanic` not recently used, `reward` via `worldRewards`, `celebration` map, `MCP` via `educationGateway recommendNextActivity/searchEducationalContent` advisory-only (Zod+age+safety validated, gateway `MCP_UNAVAILABLE` → deterministic local, child never waits); `src/lib/balloonMechanic.ts` + `src/components/child/BalloonStage.tsx` reusable balloons (`float upward 3 speeds/sizes`, `carry numbers/colors/letters/reward`, `pop ✨`, `memory` variant) for math/colors/words; `DynamicAdventureHome` + `next-adventure` API now serve `🌟 Today's Adventure` + 3 `Recommended` varied; tests `learning-adventure 9` + `dynamic-activity 6` → `269/269`.

### Fixed
- Rewards POST no longer double-counts stars (progress path owns stars; claim path owns stickers only).
- Puzzle difficulty was hardcoded to 1 (always 4 pieces, no level display); now follows the global journey level like addition.
- Child selector cards used `role="listitem"` on `<button>`, hiding them from assistive tech; removed the override.
- Sketch `Done` double-tap no longer creates two completions/rewards (synchronous `busyRef` guard + `useRoundStatus` reset); `ActivityPlayer` countdown hooks reordered before early return to satisfy `rules-of-hooks`.
- Five deterministic child games with validated Mongo-backed content pools.
- Five-agent registry, task/run/event persistence, retries, BullMQ/Redis integration, and local fallback.
- AI provider abstraction with model routing, usage tracking, budgets, and mock mode.
- Admin authentication, protected operations APIs, content approvals, pool refill, analytics, and command center UI.
- Docker Compose, Nginx reverse-proxy example, security headers, and admin setup script.
- Adaptive personalized-learning layer: learner profiles (optional nickname + age band), 15 seeded level configs, server progress/promotion, server reward mirror, interest signals, deterministic personalization engine with validated learning plans, personalization + QA agents (7 total), learner setup/plan/sticker-collection UI, per-window game shuffling, and admin learner-insights/levels/QA/personalization endpoints.
- Education Gateway (`src/integrations/education/`): provider interfaces, allowlisted registry, Tutor/OER/NCERT adapters with live HTTP contracts + deterministic mocks (all disabled by default), Zod validation, provenance + license gate, 3-tier cache, classified errors with retry/backoff, and health tracking.
- Stable concept model (`src/lib/concepts.ts`) bridging games, planner, providers, and parent progress.
- Advisory-only planner hook: gateway recommendations annotate plans; order/level/score never change.
- OER grounding for content generation with provenance stamps on produced docs.
- Parent experience: scrypt auth + HttpOnly sessions, single-use expiring pairing codes, active-link authorization, child summaries/insights/activity/progress/plan APIs, 10 parent pages, 5 public parent pages, child `/link` page, landing footer links.
- Admin education diagnostics (`providers/health/provenance`) + command-center providers panel.
- 37 gateway/parent/pairing unit tests; 52 Playwright specs across 4 viewports on system Chrome.
- Sentry SDK wired (client/server/edge configs, ErrorBoundary reporting; inert without DSN).
- Redis-backed fixed-window rate limiting on all 16 write/auth endpoints with instant memory fallback.
- Production deploy assets: `docker-compose.prod.yml` (loopback-only web, log rotation), `deploy/nginx.prod.conf` (TLS example), `npm run backup` driver-based JSON dumps, completed QA agent instructions.
- Resilience fixes (live-verified): fail-fast Redis clients + 10s negative-result caching in limiter, education cache, and BullMQ bootstrap (Redis outage previously hung requests); `COOKIE_SECURE` escape for local Docker HTTP auth while production stays Secure; `PARENT_AUTH_SECRET` plumbed through compose with `.env` auto-generation via `scripts/docker-env.mjs`.
- Sketch/Docker root-cause fix: Phaser boot read `scene.events` before SceneManager attached it, crashing all 5 games silently in production (`SKETCH_DOCKER_ROOT_CAUSE.md`); readiness now uses the Game `ready` event and boot failures warn. Added sketch color picker (cosmetic-only), canvas boot + sketch draw e2e, and sketch definition unit tests.
- Password hashes use `:` delimiters (`scrypt:<salt>:<hex>`) because `$` is interpolated by compose dotenv and Next dotenv-expand; old `$` hashes are invalid.
- Learning progression/content gap fixed: the seed now produces 25 distinct
  level-one addition combinations instead of a constant second operand; server
  content selection rotates a deterministic candidate window, excludes recent
  content IDs, and avoids duplicate problem identities. Added level-aware
  fallback ranges, server-side locked-level responses, three deterministic
  tracks, `/api/learners/:learnerId/journey`, child journey UI, parent journey
  summary, and focused learning-progress tests.
- Agentic Academic Engine (2026-09-17, MCP-powered, advisory-only): new
  deterministic core `src/lib/academic.ts` (LEARNâ†’PRACTICEâ†’PLAYâ†’RECALLâ†’REVIEWâ†’
  MASTER stage machine, review-first next-concept ordering, interest+need
  balance, spec-shaped game recommendations, no-jump post-activity decisions,
  `validateAcademicPlan` authority gate rejecting chain-of-thought/banned
  content/level jumps); `src/services/academicEngine.ts` orchestrator answering
  "what should this learner learn next?" via the Education Gateway (Tutor
  state + NCERT prereqs, isolated failures, deterministic fallback);
  `src/repositories/academicPlans.ts` (`academicPlans` collection); 8th
  least-privilege `academic-agent` (queue `academic-plan`) wired in
  `agent-store.ts` + `workers/ensure.ts`. New learner APIs
  (`/academic/plan`, `/academic/recommendation`, `/academic/voice`,
  `/academic/result`) and `GET /api/admin/academic/plans` inspection; parent
  insights/progress carry `academic {conceptsLearned/Mastered/Practicing,
  streakDays, nextActivity}` with parent-safe reasons only.
- Multi-character Voice Engine (2026-09-17): Teddy/Bunny/Owl/Monkey/Parrot in
  `src/lib/voice.ts` with 11 voice events Ã— 5 locales (en/hi/bn/ta/te,
  prepared scripts incl. the Parrot ladder â€” never live-translated);
  `voiceAssets` Mongo cache (`src/services/voiceAssetService.ts`) so gameplay
  resolves cached audio or instant device speech and never calls TTS inline;
  client `audio.ts` extended with `speakWithCharacter` (backward compatible);
  Discovery play uses the plan's character voice best-effort.
- Dynamic visual themes + cross-domain learning (2026-09-17):
  `src/lib/visualThemes.ts` (10 deterministic themes; theme never changes
  math, verified); 5 `buildCrossDomainActivity` combos (fruit+addition,
  animal+counting, color+sorting, shape+counting, bird+classification);
  content-agent object pool widened to the 10 spec visuals (math unchanged).
- Knowledge catalog growth (2026-09-17): `numbers` + `words` (basic
  vocabulary) categories (13 total, ~120 concepts) with prepared hi/bn/ta/te
  names (e.g. Parrot â†’ à¤¤à¥‹à¤¤à¤¾ / à¦Ÿà¦¿à¦¯à¦¼à¦¾ à¦ªà¦¾à¦-à¦¿); OER mock +4 discovery summaries;
  NCERT mock returns foundational-stage (Grade 1) rows with explicit
  non-official `learnzzy-native` provenance instead of invented CBSE
  alignment.
- Academic Admin + parent surfaces (2026-09-17): command-center "Academic
  engine" panel (plans/voice/signals/failures); parent Progress page "Learning
  Â· streak N days" + "Next:" card.
- 22 new `tests/academic-voice-themes.test.ts` tests (stages, ordering, plan
  gate, recommendation, decisions, voice i18n/cache, theme math-invariance);
  suite now 156/156 green; production build passes with 4 new academic
  routes + 1 admin route.
- Living Wonder visual upgrade (2026-09-17, Stitch screens 12â€“20 followed
  from written specs â€” live retrieval blocked, see STITCH_INSTRUCTIONS.md;
  game logic, scoring, pools, and agents untouched): `src/lib/characters.ts`
  + `CharacterGuide` (8 purposeful friends Ã— 8 states, calm CSS loops under
  the existing reduced-motion kill-switch) integrated into all 6 plays +
  `Celebration`; Number Orchard / Breeze Valley per-round themes via pool
  `objects.type` passthrough (`pool-client` allowlist) with deterministic
  fallback â€” Phaser apple/bird sprites stay the default path, math never
  reads the theme; working "ðŸ”Š Read aloud" buttons in addition/subtraction
  (mute-aware); persisted mute preference (`learnzzy.soundMuted.v1`) honored
  by every voice call with GameShell + Play Home toggles; `WonderWorlds`
  world-selector on `/play` (game names/taglines/hrefs preserved);
  CSS-only `SkyDrift` landing hero; Starlight night frame + Starlight-gold
  crayon for Sketch (guides remain vector â€” asset trace found zero image
  dependencies, so no broken-image class of bug exists there).
- 13 new `tests/characters.test.ts` tests; suite now 169/169 green;
  Playwright 51/51 green (child/discover/canvas/sketch/adaptive/parent/
  admin/learning-journey across mobile-320/mobile/tablet/desktop on system
  Chrome against the fresh production build).
- Stitch screens 12â€“20 retrieved live (2026-09-18): `list_screens` +
  `get_screen` over the Stitch MCP (`STITCH_API_KEY`) then `curl -L`
  downloads â€” 7 game/world HTML files + 9 screenshots (7 screens + 3 square
  art boards) under `docs/stitch_learnzzy_educational_kids_playground/`;
  the 3 art boards optimized via `sharp` to 640px WebP postcards (36â€“54KB)
  at `public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp`.
  Child surfaces restyled from the actual designs (game logic, scoring,
  pools, agents, e2e contracts untouched): `src/lib/worlds.ts` world
  metadata + `WonderBits` shared bits (`GuideCard`, `StepperTrail`,
  `QuestFeedbackBar`, `ClueButton`); banner-style `WonderWorlds` cards with
  island/host/spark pills; Buddy Pip greeting with spoken invite + amber
  "Spin for a Wonder Adventure!"; Number Orchard / Breeze Valley stage cards
  (branch badges, glow ring, question banners, counting guidance); Pip quest
  stepper + item pill + clue bar for Clean Up ("Wonderful Job!" finale);
  dino art guide + "Dino is Awake!" for Puzzle; Bella Bunny guide + Stitch
  wand names + elephant-art hint for Sketch; `anim-bob-alt`/`anim-wiggle`/
  `anim-glow` keyframes under the existing reduced-motion kill-switch.
  Deliberate deviations recorded (DEC-187): WebGL Shader not adopted
  (performance/battery), subtraction host stays Teddy (tested mapping),
  Clean Up mechanics unchanged, Stitch names are display-only.
- 5 new `tests/worlds.test.ts` tests; suite now 174/174 green; typecheck,
  lint, `next build` green; Playwright child/sketch/discover/adaptive/
  learning-journey green on mobile; `/play`, `/play/addition`,
  `/play/clean-up` screenshot-verified; production `docker build`
  (`learnzzy:stitch-check`) succeeds.
- Worksheet-inspired Learning Playground (2026-09-18, DEC-188): `/play` is
  now category-first â€” 6 Learning World cards (numbers/words/think/create/
  discover/puzzles, `src/lib/categories.ts`) â†’ `/learn/[category]` â†’ 16
  activities (`src/lib/activityRegistry.ts`). Ten new activities (count,
  order, before-after, shape-count, big-small, word-family, word-match,
  trace-write, pattern, find-object) run on one generic engine:
  deterministic generators (`src/lib/activityContent.ts` â€” no LLM, exactly-
  one-correct, rotated answers/visuals, teaching hints) + reusable
  `ComplexityProfile` (`src/lib/complexity.ts`, spec Â§27 baseline, age
  changes the actual problem, `timePressure` always 0) +
  `GET /api/activities/[activityId]/content` (learner skill lookup
  best-effort, `recentIds` exclusion, works without Mongo) + one
  `ActivityPlayer` (character states, hint ladder, read-aloud, completion
  via existing game-events + `academic/result` â€” no new contracts, so
  per-skill `skillLevels`, parent dashboards, and the academic engine work
  unchanged; MCP/gateway untouched). Shipped engines linked, never
  duplicated. 8 new tests (`activity-registry` + `activity-content`);
  suite now 182/182 green; `next build` green (76 routes).
- Animal Wonderland Rich + Home Learning World (2026-09-18, Session 10):
  landing validated against new Stitch `d14a9b61` + `4b8445bd` (ANIMATION_45
  Rich: 5 candy mushrooms + 5 bobbing apples + 15 warm stars + 4 birds +
  tap jump burst) via `curl -L` under `.stitch/1495487808742926612/` and
  `public/images/stitch/home-child-first-v2.png`; `AnimalWonderland3D`
  updated to match (camera, mushrooms, apples, 15 stars, 4 birds,
  `pointerdown` jump, deterministic). Landing now category-primary per spec
  Â§2/Â§3 (hero â†’ CTA â†’ `HomeContinue` personalized Good-morning + plan card
  â†’ 7-category `CATEGORIES` grid â†’ secondary 5-tile shortcuts â†’ games
  gallery â†’ voice board â†’ safety) while preserving Stitch hierarchy.
  `BrandLogo` every header now â†’ `/play`. Fixes: `genTraceWrite`
  `answerIndex: 0` â†’ `options.indexOf(answer)` with tightened
  `activity-content` assertions (`options[answerIndex]==answer` across
  bands) + `resolveComplexity` dead `nudge` removal. 189/189 unit
  (47 suites), `tsc`/`eslint`/`next build` green.
- Calm Warm Female Voice (2026-09-18 Session 11): `src/lib/voice.ts` 13
  events + `VoiceScript` (ageBand/language/emotion/speakingRate/
  volumeProfile/pauseAfterMs) + `createVoiceScript`/`getVoiceProfile` +
  5-locale soft scripts ("Wonderful. You got it.", "Not quite. Let's look
  carefully.", "Take your time."), `src/lib/audio.ts` calm presets
  (0.82â€“0.88 rate, 0.97â€“1.05 pitch, volume 0.85, 900ms throttle for thinking
  time), `src/lib/characters.ts` calm `STATE_LINES`. TTS stays cached +
  device fallback, never blocks, mute respected. 190/190 unit (+calm-quality
  test), `tsc`/`build` green.
- Organized Wonder Play + Docker-First MCP (2026-09-18 Session 12):
  Gaps closed: `/play` had 18/25 activities and generic hubs; now all **25**
  activities shown organized by World (Numbers 8, Words 2, Write 3, Think 7,
  Shapes 3, Discover&Puzzles 2) in `More Adventures` + 6 Stitch Category Hub
  cards (Math Kingdom, Language Nest, Logic Grove, Rainbow Studio, Nature
  Savannah, Wooden Playroom) with tactile `0_5px_0` shadows. Fixed
  `WonderArchipelago3D` (`ANIMATION_48` archipelago, fog, 3 biomes) full-screen
  wonderland, child-friendly soft gradients, 56px+ targets. Missing tiles added:
  `more-less`, `count-by-tens`, `trace-number-name`, `matching`,
  `odd-one-out`, `pattern`, `shape-match`. Docker-first MCP shim `services/mcp`
  (`node:20-alpine`, non-root, `HEALTHCHECK`, `/health`/`/capabilities`/`/metrics`,
  Bearer auth, `/data` volumes) for `tutor-mcp:3001`, `oer-mcp:3002`,
  `ncert-mcp:3003` + `qdrant:6333` on private `learnzzy` bridge, service DNS,
  prod override hides host ports, `scripts/docker-health.mjs` + `npm run
  docker:health`. Education Gateway unchanged (advisory, fallback to mocks).
  Stitch `1b8480cd` Category Hub + `a1812/9fa2` Archipelago + `00259/3f852`
  level maps + `f66f/38d8/77cc` games fetched via `curl -L`.
  `docker compose config` OK, 190/190 unit, `tsc`/`build` green.
- All 25 Validated â€” Big & Small Fix (2026-09-18 Session 13): child reported
  `Big & Small` identical visuals and wrong maths; `ActivityContent` now
  carries `visualMeta {sizes, wantBiggest}` and `ActivityPlayer` renders scaled
  pills (`0.7â†’1.8` for 4â€“5, `0.9â†’1.3` for 8â€“9) with `1..n` badges so maths is
  visible and deterministic (`answer = indexOf biggest/smallest +1`). Full
  validation of `All Wonder Adventures` 25 tiles (generic 19 + game-route 6)
  across all age bands: `exactly-one-correct`, `unique`, `index-points-at-answer`,
  `visual length == n`. `GET /api/activities/...` still globalLevel+mastery.
  No MCP needed; `npm test` 190/190 remains green.
- Global Level + Personalized Session Planner (2026-09-18 Session 14): one
  global `level 1..6+`, no per-game visible levels; `skill mastery` internal
  (`evaluateSkill` on `recentAccuracy`), `complexity = global + masteryAdj`
  via `resolveComplexity`; new `PersonalizedSessionPlanner` deterministic
  (`hashSeed`/`mulberry32`, interest+need+variety, top-stays+shuffled rest,
  expiresAt+1day); `buildPlan` all items `level = globalLevel`;
  `levelService` global promotion (total completions â‰¥3, avg â‰¥0.80, variety);
  new `GET /api/learners/[id]/session`; UI shows `Global Level` + mastery
  strengths. `npm test` 190/190, `tsc` 0.
- Natural Human-Like Female Voice â€” Root Cause (2026-09-18 Session 15):
  inspection of `speechSynthesis`/`SpeechSynthesisUtterance`/`getVoices`/
  `voiceAssetService` shows `voiceAssets` pending (KI-020), `rate/pitch` only,
  no SSML/breath, `pauseAfterMs` unused, robotic eSpeak fallback. Decision:
  server `ttsProvider` (`tts-1-hd` warm female) â†’ `voiceAssets.audioUrl` â†’
  `HTMLAudio` preload, `speechSynthesis` only offline fallback.


- Global Level Journey + Auto-Next + Interactive Feedback (2026-09-19 Session 16): all exercises share GLOBAL Level (visible LEVEL N badge on ActivityPlayer/Addition/Subtraction), no per-game levels; skill mastery internal. Exercise lifecycle: Exercise starts -> Child solves -> Server validates -> Correct? SUCCESS/RETRY -> Feedback (green/red) -> Next enabled -> 10s countdown (progress bar) -> Automatic next (setTimeout 10000, cancel on manual). Implemented in ActivityPlayer (countdown, success/retry UI) and math games (globalLevel from getCachedProfile, difficulty = ceil(global/2), goNext). Complexity: GLOBAL + AGE BAND + PERFORMANCE + SKILL MASTERY + INTEREST + RECENT -> Activity Complexity with age-band boundaries (4-5 simple, 6-7 intermediate, 8-9 advanced) and MCP advisory (Tutor via Education Gateway, 800ms timeout, 7 validations, fallback to deterministic). MCP failure never blocks child. Verified: npm test 190/190, tsc 0.

- Words & Phonics first-class track (2026-09-19): added `src/lib/words.ts` as
   the single deterministic source for 19 seeded word families, word validation,
   age-band complexity, and learner exercise mixing. Added five generators:
   jumble, builder, family sorting, listen-and-choose, and rhyme discovery.
   Existing word-family and picture-match generators reuse the same family data.
   Added build-order, sort-choice, and listen-choice renderers, seven Words &
   Phonics tiles, and `/play` coverage for all 30 registered activities. Added
   `tests/words-phonics.test.ts` and focused mobile Playwright coverage (4/4).
   Verified: 213/213 unit tests, typecheck, lint, and production build.

- Mini Mission Engine (2026-09-19): added deterministic 3-10 minute missions
  with five approved templates (Remember & Find, Sort & Group, Build the Word,
  Change One Thing, Find the Difference), age-safe planning, server-owned step
  validation, reusable primitive rendering, attempt/evidence persistence,
  learner and parent projections, and Today's Adventure. Added the mission
  route/API surface, five additive Mongo collections/indexes, unit coverage,
  and Playwright coverage across mobile-320, mobile, tablet, and desktop (20/20). Mission gameplay has no
  live AI or MCP dependency; live-Mongo, device, TTS, and Stitch validation
  remain open.

### Changed
- `/api/games` now exposes all five MVP games as active.
- Empty or low content pools trigger asynchronous refill without blocking gameplay.
- `knowledge.test.ts` locale test now asserts prepared hi/bn Parrot names (translation pipeline landed) with English fallback for untranslated concepts.

### Fixed
- Added strict validation for generated math, scene structure, safety terms, duplicates, and content lifecycle.

### Removed
- None.


- Balloon Letter/Animal + 100-Level (2026-09-22): balloonLetter A-Z/word-initial/7 balloons + BalloonLetterStage h-[360px] balloonWordsPlay (	ap 🎈 or type B, keydown A-Z → pop, WorldReward), alloonAnimal 🐱 CAT C-A-T + BalloonAnimalsPlay (ind 🐱), registry alloon-words/animals (words 8, discover 3, 32→34 activities, 46 total), skillLevels MAX 100, learningJourney 5 tracks 11 games shuffled + 5-window centered 96→100, play/* ?level=1..100 Continue → Next Level Harder (addition PlusOperator single +, Sketch Wonderful job!), knowledge-check Numbers/Words mixed-quiz + 4 AI-enriched multiplication, geometry, plants, computing → curriculum 10/10 100%, 280/280 tests (72 suites).
