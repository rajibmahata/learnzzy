# CURRICULUM IMPLEMENTATION AUDIT — Learnzzy Educational Kids Playground
**Date:** 2026-09-22
**Auditor:** OpenCode (Muse Spark)
**Mode:** Read-only, no production code modified
**Tests:** 280/280 suites 72 pass, typecheck 0, build 80 routes

## 1. Package & Structure
- **Stack:** Next.js 14.2.5 TS, React 18, Tailwind, Phaser 3.60, MongoDB 7, Redis 7, BullMQ, Zod 3.22, Sentry, Jest/node:test
- **Root:** `src/app/{play,learn,admin,parent,api}` `src/games/{addition,subtraction,cleanup,puzzle,sketch,balloonLetter,balloonAnimal,framework}` `src/components/{child,learner,admin,brand,ui}` `src/lib/{activityRegistry,learningActivities,learningWorlds,mechanics,complexity,words,knowledge,concepts,balloonMechanic}` `src/integrations/education/*` `src/services/*` `src/repositories/*` `src/db/mongodb` `services/mcp` (tutor/oer/ncert + qdrant)
- **Config:** `.env.example` 63 vars, `docker-compose.yml` 210 lines (web + mongo 27018 + redis 6379 + 3 MCP + qdrant), `next.config.js` `withSentryConfig` `serverComponentsExternalPackages: bullmq,ioredis`, `package.json` scripts `curriculum:validate`/`games:validate` not yet present (gap)

## 2. Routes
- **Child:** `/` (WonderArchipelago3D + 5 tracks 11 games shuffled), `/play/{addition,subtraction,clean-up,puzzle,sketch,discover,balloon-words,balloon-animals}`, `/learn/[category]/[activity]` (generic `ActivityPlayer`), `/missions/[missionId]`, `/welcome?next=`, `/stickers`, `/link`
- **Parent:** `/parent/*` 10 pages (`children, progress, rewards, learning, help`) + `/parents/*` 5 public
- **Admin:** `/admin` `AdminDashboard` (agents, pools, analytics, education health, academic, commands, content review, **Activities & Worlds 15/46**)
- **API:** 80 routes (`/api/learners/[learnerId]/*` 15, `/api/admin/*` 20, `/api/activities/[id]/content`, `/api/games/[id]/content`, `/api/missions/*`)

## 3. Game Components & Phaser Scenes
- **Addition:** `AdditionPlay.tsx` 388 lines, `AdditionStage` + `AdditionScene` (LEFT/RIGHT zones, `+` at W/2, apple svg), `AdditionStage` fallback DOM, `AnswerButton` 4 pads
- **Subtraction:** `Breeze Valley` `SubtractionStage` with `showGroups(a,b)` birds, `handleContinueHarder` REST `?level`
- **CleanUp:** `CleanupStage` `createCleanupScene` targets 2..8, `isSceneComplete`
- **Puzzle:** `PuzzleStage` `createPuzzleDef` 4/6/9 pieces `validatePuzzleDef`
- **Sketch:** `SketchStage` `createSketchActivity` 20 shapes, `evaluateTracing` coverageThreshold 0.5..0.6
- **Balloon:** `BalloonStage` + `BalloonLetterStage/AnimalStage` reusable `float 3 speeds/sizes`, `pop ✨`, `phaser/layout.ts` gridPositions
- **Shared:** `GameShell` + `GameHeader` (single `🏠 title ⭐ 🔊`), `GuideCard` 8 states, `StepperTrail`/`QuestFeedbackBar`, `Celebration`/`WorldReward` full-viewport, `BalloonBurst`

## 4. Shared Components
- **UI:** `Button, IconButton, Card, Badge, Progress` `src/components/ui`
- **Child:** `GameCard, GameHeader, StarCounter, AnswerButton, Celebration, GameShell, Balloon*Stage, CharacterGuide`
- **Learner:** `ChildSelector, LearnerSetup, LearningJourney (5 tracks 11 games shuffled per hashSeed(learnerId)), GamePlan, ContinueLearning, DynamicAdventureHome, HomeContinue, TodaysAdventure`
- **Brand:** `BrandLogo` `→ /play`
- **Design System:** Tailwind tokens `primary,secondary,tertiary`, `Plus Jakarta Sans`, `rounded-lg 2rem`, `shadow-card`

## 5. APIs
- **Learner:** `POST /api/learners` (create), `GET/PATCH /api/learners/[id]`, `GET /journey, /adventure, /plan, /next-adventure (LearningAdventureEngine), /concepts, /mission-progress, /progress, /rewards, /rewards/claim, /session, /signals, /skills, /academic/*`
- **Game:** `GET /api/games/[gameId]/content` `GAME_IDS` addition/subtraction/clean-up/puzzle/sketch, `toAdditionContent` recomputes `a+b`
- **Missions:** `GET/POST /api/missions/[missionId]/attempt|steps/[stepId]/result`
- **Admin:** `/api/admin/agents, tasks, pools, analytics, education/health, commands, content, academic/plans, activities (46), worlds (15)`, `requireAdmin()` via `currentAdmin()` `lz_admin` HttpOnly
- **Parent:** `/api/parent/*` `scrypt + lz_parent` single-use `XXX-XXX` codes, `active-link` auth

## 6. MongoDB Models
- **Collections:** `admins, games, gameConfigs, content, contentVersions, assets, assetVersions, assetTags, sessions, gameEvents, agents, agentTasks, agentRuns, agentEvents, academicPlans, voiceAssets, difficultyRules, difficultyRecommendations, systemSettings, aiUsage, auditLogs` + **additive** `missions, missionTemplates, missionAttempts, missionSteps, learnerMissionProgress, rewardClaims (claimId unique), educationKnowledge`
- **Learner:** `learners {learnerId, displayName, nickname, avatar, companion{characterId,displayName}, ageBand 4-5|6-7|8-9, level 1..100 global, gameLevels 1..100 per-game, gameProgress[gameId]{completions,recentAccuracy[10],hintsUsed,recentResponseTime,learningBehavior}, interests, stickerIds, onboarding, voicePreference}`
- **Indexes:** `missions, missionTemplates, missionAttempts, missionSteps, learnerMissionProgress, rewardClaims.claimId, content(gameId,difficulty,status), gameEvents(sessionId,createdAt)`

## 7. Learner Models & Progress
- **Profile:** `learnzzy.activeLearnerId + learners.v1 + learner.v1 + sessionId.{id} + rewards.v1.{id}` `getCachedProfile()/normalizeAgeBand()`
- **Progress:** `recordGameResult` (`accuracy, attempts, responseTimeMs, hintsUsed`) → `recentAccuracy[10]` → `evaluateSkill` rolling avg(5) → `decideSkillLevel` `3@80%+ → +1 max 100` / `5@<50% → -1 min 1` else `stabilize` (skill-isolated), `levelService checkPromotion` global `3@80%+` variety → `1..100`
- **Personalization:** `PersonalizationService → PersonalizedSessionPlanner buildPersonalizedSessionPlan` deterministic `hashSeed/mulberry32` `interest+need+masteryGap - variety - recency + engagementBoost+noveltyBoost+worldBoost≤0.35`, `LearningAdventureEngine recommendNextActivity` + `DynamicActivityEngine chooseDynamicActivity` (`mechanic+theme+environment+reward+celebration`) + `ActivityVarietyEngine repetitionPenalty/isBoringRepeat` + `ActivitySelector` learner-isolated, `GET /api/learners/[id]/next-adventure` for `DynamicAdventureHome` `Today's Adventure + Recommended 3`

## 8. Activities
- **Registry:** `ACTIVITY_REGISTRY 38` (`src/lib/activityRegistry.ts`) `ActivityDef {id,category,title,icon,skills,ageBands,activityType,complexityDimensions,href/generator,renderer,validator,blurb}` + `LEARNING_ACTIVITY_REGISTRY 46` Zod `LearningActivity {id,type:GAME|MISSION|DISCOVERY|STORY|CREATIVE|EXTERNAL_STORY, world(15), skill, mechanics, theme, estimatedDuration, rewardTags, safetyStatus, provenance}` legacy→learning + 21 new (6 addition variants `balloon-pop-addition/dinosaur-eggs/...`, `color-detective/animal-safari/butterfly-garden/robot-path/fruit-sorting/draw-a-monster/balloon-words/animals/knowledge-check-*`)
- **Content:** `activityContent.ts 27 generators` (`genCount, genColorDetective, genAnimalSafari, genButterflyGarden, genRobotPath, genWordFamily...`) deterministic `hashSeed`, `exactly-one-correct`, `visualMeta sizes`, `double` `knowledge-check` mixes, `TimePressure always 0`
- **Worlds:** `learningWorlds.ts 15` `colors,animals,birds,insects,nature,dinosaurs,ocean,words,numbers,thinking,creative,robots,fruits,space,stories` each `mechanics[]` distinct
- **Mechanics:** `mechanics.ts 18` `BalloonPop, ObjectCollect, DragDrop, TapTarget... StoryChoice, BuildObject` `SKILL_LEVEL_MECHANICS` `addition 1:BalloonPop →8:multi-step`, `color-recognition 1:basic →7:logic`

## 9. Rewards & Stickers
- **Catalog:** `stickers.ts 54` `STICKER_CATALOG` 8 cats, `selectUnownedSticker` deterministic, `milestones 5/10/25/50`, `ACTIVE_STICKERS`
- **Engine:** `repositories/rewards claimReward $addToSet + rewardClaims.claimId unique`, `rewards.ts per-learner hydrates server wins`, `WorldReward 54` `WORLD_EVENT_CONFIGS` (`rex walk jungle`, `boat sail ocean`, `robot walk playroom` now) `fixed inset-0` `translateX±55vw` 3–8s `prefers-reduced-motion` safe, used in 6 plays + `ActivityPlayer` + `MissionPlayer`, `Celebration` fallback, `BalloonStage` reuse

## 10. Agents
- **7 workers:** `Content, Quality, Asset, Analytics, Difficulty, Personalization, QA, Academic` (`academic-agent` queue `academic-plan`), `agent-store.ts` `AGENTS`, `workers/ensure.ts` `BullMQ` `REDIS_URL` in-process fallback, `auditLogs`, `aiUsage`, least-privilege

## 11. Personalization
- **Flow:** `Gameplay → events/analytics → learningSignals → PersonalizationService → LearningAdventureEngine → ActivitySelector → Validated Content → Gameplay`; deterministic `masteryToComplexityAdjustment` → `resolveComplexity` age-banded, `worldBoost` from `ownedThemes/GameAffinity`, no second system, `explainability {skill,difficulty,theme,reason}` for admin

## 12. Difficulty & Performance Engine
- **Difficulty:** per-skill 1..100 `evaluateSkill` rolling avg, `decideSkillLevel` `stabilize` before `reduce`, `resolveComplexity(skill, ageBand, effectiveLevel)` `numberRange/itemCount`, never `timePressure`
- **Performance:** skill-isolation verified `skills decide independently`, `trend` `improving/steady/needs_practice/strong`

## 13. Mission Engine
- **5 templates:** `Remember & Find, Sort & Group, Build the Word, Change One Thing, Find the Difference` 3–10min, deterministic `missionEngine.ts` `validate {exact,set,sequence}` + `missionPlanner` age-safe `recency penalty` + `TodaysAdventure`, `ActivityRenderer` primitives

## 14. Education Gateway & MCPs
- **Gateway:** `src/integrations/education/gateway.ts:42` single server entry `educationGateway {getLearnerState, recordLearningEvidence, recommendNextActivity, searchEducationalContent, getConcept, searchCurriculum, getPrerequisites, health}` allowlisted `tutor-mcp|oer-mcp|ncert-mcp`, `Zod` `KnowledgeResultSchema` `Provenance` `license CC0`, `boolEnv(enabled,false)&&!!baseUrl` fail-closed, `cache 6h/15m`, `withObservation` health, advisory-only
- **Providers:** `config.ts:41` `TUTOR_MCP_ENABLED=false` default, `docker-compose.yml:67` `tutor-mcp:3001 oer-mcp:3002 ncert-mcp:3003 + qdrant:6333` `services/mcp/Dockerfile node:20-alpine` `server.js:303` mock REST `POST /learner-state|/next-activity|/search|/concept|/search-curriculum` + `/health` `200`, deterministic fallback local `mulberry32`

## 15. Admin
- **Dashboard:** `AdminDashboard.tsx:264` panels `Agent fleet, Content pools, Learning signals, Recent tasks, Education providers, Academic engine, Command history, Content review, Learning Activities & Worlds (15/46)`, `natural language → structured tasks` `BR-162`, `requireAdmin()` `lz_admin` HttpOnly

## 16. Parent Dashboard
- **Pages:** `10` (`children, progress, rewards, learning, help`) + `5 public` `parents/*`, `child/link` pairing `XXX-XXX` single-use expiring, `scrypt:l...` `:` delimiter, `parent/learners` insights `academic {streak, nextActivity}` + `Journey` `Global Level` + `Star` + `Badge` `Activity`, `GET /api/parent/children/[id]/*` `active-link` auth

## 17. Child Onboarding
- **Welcome:** `/welcome?next=` `useSearchParams + Suspense` `ChildSelector` `router.push(next)` fixed, `LearnerSetup` single-page progressive unlock `name→nickname→companion 12→age→parent link→sticker`, `PATCH /api/learners/[id]` display-only, `learnzzy.activeLearnerId` canonical

## 18. Home & Navigation
- **Landing:** `AnimalWonderland3D` + `5 tracks 11 games shuffled per hashSeed(learnerId)` `LearningJourney` (`All 5 Worlds • 11 Games` `grid md:grid-cols-2 lg:grid-cols-3`), `DynamicAdventureHome` `Today's Adventure` + 3 `Recommended`, `All Wonder Adventures 34` tiles `2-4 cols`
- **Nav:** `GameShell` single `🏠 title ⭐ 🔊` (fixed duplicate `nutrition` pill removed), `AdditionExpression` `OperandCard + PlusOperator + OperandCard` single `+`, `StepperTrail` `1 2 🔒`, `Next Level` `h-14` `router.push ?level=`

## 19. Analytics
- **Events:** `session_started, game_started, question_shown, answer_submitted/correct/incorrect, retry_started, game_completed, puzzle_*, drawing_*, balloon pop` `queueEvent/syncEvents` `POST /api/game-events/batch` `clientIp/takeAsync` rate-limit `60/min`, `recentFingerprints` for `VarietyEngine`

## 20. Tests
- **280 tests** `71 suites` `learning-adventure 9, dynamic-activity 6, mechanics 5, worldRewards 6, skill-performance` etc., `typecheck 0`, `build 80 routes`

## 21. Seed Data
- **Content:** `content` seeded `30/100` per game `addition/subtraction` `100` `clean-up/puzzle/sketch` `30`, `WORD_FAMILY_DATA 19 families`, `KNOWLEDGE CONCEPTS 120`, `STICKER_CATALOG 54`, `voiceAssets` pending `KI-020`

## 22. Docker
- **Compose:** `web:3000 → mongo:27017 redis:6379 tutor:3001 oer:3002 ncert:3003 qdrant:6333` `learnzzy` bridge, `service DNS` `http://tutor-mcp:3001`, `expose` + `127.0.0.1:3001:3001` host-mapped, `healthcheck wget /health`, `depends_on service_started` not `healthy` (child never blocks)

## Gaps
- **Curriculum:** No unified `CurriculumFramework/Stage/Subject/Outcome` model yet (only `ACTIVITY_REGISTRY` `skill` + `learningActivities` `world/category`); CBSE/NCERT/NCF/NIPUN/Cambridge/IB/Pearson registries missing; `15` learningWorlds exist but not mapped to official `sourceUrl/version/provenance`; `58+` skills not yet grouped into `Language/Math/Science/EVS/Computing/GlobalPerspectives/Art/Music/PE/Wellbeing` domains; no `curriculumMappings[]` per activity.
- **Activities:** `60` mechanics defined `MECHANICS 18` but `LearningActivityRegistry` still `46` entries, many curricula outcomes uncovered; `EXTERNAL_STORY` curated but `parentApprovalRequired` UI not wired.
- **Levels:** Skill-specific `1..100` now, but `multi-level` content for each skill `1..8` only covers `addition/color` via `SKILL_LEVEL_MECHANICS`, `word/butterfly` not yet 8 levels.
- **Coverage:** No `CurriculumCoverageService`, no `docs/CURRICULUM_COVERAGE_REPORT.md` matrix `Framework×Subject`, no `MISSING_*` gap detector.
- **Validation:** No `npm run curriculum:validate` CI, no `npm run games:validate` mechanics/levels/assets/route check, no `GAP_DETECTOR` measurable `COVERED/PARTIAL`.
- **Admin:** No `/admin/curriculum/*` `frameworks/stages/subjects/outcomes/mappings/gaps/validation/activities` with `Coverage %`.
- **Parent:** No curriculum-aligned `Subject→Skill→Level` progress or `Curriculum preference (CBSE/ICSE/Cambridge/IB)`.
- **Reusable:** `BalloonMechanic` reused for 6 addition variants + letters/animals, but `ObjectCollect, ObjectSort, PathBuilder` not yet composed as `Learning Objective + Mechanic + Theme + Environment + Content + Reward` primitive instances per spec §35.
- **Duplicate Logic:** `learningJourney.ts` previously 3 tracks hard-coded, now 5 with shuffling — no duplicate learner leakage, but `learningActivities` + `activityRegistry` dedup via `byId` is manual.
- **Risks:** `MCP` mock data `OER_SUMMARIES 4`/`NCERT_MAP 3` tiny, `Qdrant` file fallback; `next.config withSentry` instrumentation hook warning; `docker-compose` host `fonts.gstatic.com ENOTFOUND` timeout previously hid lint; `WorldReward` 54 configs but `multilingual` validation still prepared hi/bn/ta/te only, not dynamic per curriculum.

## Reusable Components
- `BalloonStage/LetterStage/AnimalStage` + `AdditionStage` + `CleanupStage/PuzzleStage/SketchStage`, `GameShell/Header, GuideCard, StarCounter, Celebration/WorldReward/BalloonBurst, BrandLogo, Button, Mechanics, Worlds`

## Technical Risks
- `MCP_URL` `tutor-mcp:3001` unresolvable on host `npm run build` without `127.0.0.1` mapping; gateway correctly fail-closed but `next build` lint previously failed on `Today&apos;s` emoji corruption.
- `learningJourney` 100-level window `start = max(1,min(96, current-2))` UI still 5 nodes, not 100 scroll.
- `skillLevels MAX 100` vs `complexity` `numberRange` caps at 100, not yet 8 distinct mechanics per level.

