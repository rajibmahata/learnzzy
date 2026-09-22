# Living Sticker Forest — Audit (Read-Only, 2026-09-22)
**No production code modified in this phase.**

## 1. Existing Sticker Model
- `src/lib/stickers.ts:20` `StickerDef {id, name, emoji, category: animals|flowers|nature|food|space|transport|fantasy|discovery, rarity: common|special|rare, description, sortOrder, active}`
- `STICKER_CATALOG 54` incl. `rex🦖`, `lion, elephant, butterfly🦋, bird, bear, sunflower, rainbow🌈, apple🍎, rocket🚀, boat⛵, balloon🎈, dragon, unicorn, robot🤖` etc.
- `ACTIVE_STICKERS = catalog.filter(active)`, `byId Map`, `resolveStickerIds`, `selectUnownedSticker(ownedIds, seed)` deterministic `hashSeed FNV-1a % unowned.length`, `milestones 5/10/25/50`, `validateCatalog()` unique id/category check.
- `src/lib/rewards.ts:14` `Sticker {id, emoji, name, gameId, earnedAt, pending?}` `RewardsState {totalStars, stickers[]}` per-learner `learnzzy.rewards.v1.{learnerId}` + `learnzzy.rewards.hydrated.v1.{id}` + `activeLearnerId`.

## 2. Existing Reward Model
- **Server authoritative:** `src/repositories/rewards.ts:1` `claimReward(learnerId, gameId, claimId)` → `selectUnownedSticker(owned, seed)` + `rewardClaims` collection `unique claimId` + `learners.stickerIds $addToSet` + `totalStars` — no duplicate, `collectionComplete` milestone fallback.
- **Client cache:** `src/lib/rewards.ts:85` `addReward(gameId, stars)` optimistic `pending_...` + `reconcileSticker(tempId, serverSticker)` dedup + `adoptServerSticker` + `hydrateFromServer(server.stickerIds)` server wins.
- **Milestones:** `crossedMilestone(before,after)` derived from count.
- **WorldReward:** `src/lib/worldRewards.ts:47` `WORLD_EVENT_CONFIGS 54` `WorldRewardEvent {rewardId, category, eventType, environment: jungle|ocean|sky|space|garden|playroom, asset {emoji,scale,entranceDirection}, animation walk|sail|fly|grow|appear|launch, durationMs 3–8s, soundEffects, particleEffects, companionReaction, rewardTags, learningThemes, gameAffinity}` + `selectWorldEvent(stickerId, variantSeed)` deterministic `hash%4` + `CATEGORY_FALLBACK` for missing.

## 3. Existing Sticker Unlock Flow
- **Game completion:** `addition/subtraction/clean-up/puzzle/sketch/balloon-words/animals` + `ActivityPlayer` → `award(gameId, 3)` optimistic + `queueEvent game_completed` + `reportGameCompletion({gameId,accuracy,stars,stickerId})` → `POST /api/learners/[id]/progress` (`completionId` idempotent, `stars` owned by progress) + `POST /api/learners/[id]/rewards/claim` (`claimId = completionId`) → server `claimReward` → `reconcileSticker`.
- **Missions:** `MissionPlayer.tsx:121` `POST /api/missions/[id]/attempt` `action:complete` → `stars` + claim via `rewards/claim` with same `attemptId`.
- **Direct:** `GET /api/learners/[id]/rewards` + `hydrateFromServer`, `POST /api/learners/[id]/rewards/claim` for generic activities.
- **Learner isolation:** `learnzzy.activeLearnerId` canonical, `rewardClaims` per-learner, `recentCompletionIds[50]` dedup, `guest` never writes `learnerMissionProgress`.

## 4. Existing Assets
- **Stickers:** emoji-only (`🦁 3d` not image), zero payload, no `S3` image yet. `public/assets/learnzzy/games/{clean-up,puzzle,sketch}/scene.webp` 36–54KB postcards, `public/images/stitch/*`.
- **Phaser:** `src/games/phaser/{additionScene,cleanupScene,puzzleScene,sketchScene,layout.ts}` `gridPositions`, `usePhaserGame` `FIT+CENTER` `ready+booted` 4s fallback, `prefers-reduced-motion` kill-switch, `BalloonStage` CSS `perspective:900px` `translateZ`.
- **Audio:** `src/lib/audio.ts:20` `CHARACTER_VOICES` 12 `rate 0.82–0.99 pitch 1.05–1.28` `pickChildFriendlyVoice` + `playCompanionSound` Web Audio chime/pop/twinkle per companion, throttle 350ms, `isSoundMuted`, `voice.ts` 5×11×5 scripts + `voiceAssets` cache `device speechSynthesis` fallback.

## 5. Existing Animations
- **WorldReward:** `walkAcross`/`sailAcross`/`flyAcross` `translateX±55vw` `scale` `dust/waves/sparkles` + `BalloonBurst` `balloon-rise 1.2s` CSS `animate-bounce/ping` + `CharacterGuide` `char-*` states, `requestAnimationFrame` not used, CSS only for performance.
- **Celebration:** `fixed inset-0` `bg-gradient-to-br` + `BalloonBurst` + confetti `12` `✨🌟💫`, `prefers-reduced-motion` → `opacity fade` only.
- **Balloon:** `BalloonStage` `animate-bounce` per `speed/delay`, `BalloonLetterStage` `bottom-0` `left x%` `width 3.2rem` `pop 💥`.

## 6. Existing APIs
- **Reward:** `GET /api/learners/[id]/rewards` (server truth), `POST /api/learners/[id]/rewards/claim {gameId, claimId}` → `{sticker, milestone, stickerCount, totalStars}`, `POST /api/learners/[id]/progress {gameId, accuracy, stars, stickerId, completionId, durationMs, hintsUsed}` → `{level, skill, claim}`
- **Learner:** `GET/PATCH /api/learners/[id]`, `POST /api/learners` (guarded create), `GET /api/learners/[id]/journey|plan|next-adventure|skills`
- **Collection:** `src/app/stickers/page.tsx:1` `ServerCollection` via `GET rewards` → `hydrateFromServer`, `learnzzy.rewards.v1.{learnerId}` grid by `STICKER_CATEGORIES`, milestone 5/10/25/50 derived, `?` locked.
- **Game/Mission:** `POST /api/missions/[id]/attempt` `start|complete`, `POST /api/missions/[id]/steps/[stepId]/result`, `GET /api/learners/[id]/mission-progress`, `POST /api/game-events/batch` `learnerId` on every event

## 7. Existing Reusable Components
- `WorldReward.tsx:56` `WorldRewardProps {sticker, character, stickerCount, levelProgress, milestone, variantSeed, continueLabel, onContinue, onReplay}` full-viewport cinematic
- `Celebration.tsx:17` `Celebration {title, stars, sticker, character, milestone, stickerCount, voiceLine, levelProgress, onReplay}` `BalloonBurst`
- `CharacterGuide.tsx:1` `state curious|happy|encouraging|celebrating` `compact`
- `StarCounter`, `LearningJourney` (5 tracks 11 games shuffled per `hashSeed(learnerId)`), `WonderWorlds`, `BalloonStage` family, `Stitch` 3D `AnimalWonderland3D`/`WonderArchipelago3D` `Three.js` isolate

## 8. Existing Reward Events
- `WORLD_EVENT_CONFIGS` 54 entries (`rex jungle walk 6500ms`, `boat ocean sail 7000ms`, `robot playroom walk 6200ms`, `butterfly sky fly 6000ms`, `apple garden grow 5600ms`) + `selectWorldEvent` + `validateWorldEvent` + `DEFAULT_EVENT` `playroom ⭐ walk`

## 9. Existing Learner Ownership Model
- **Per-learner isolated:** `learners.stickerIds[]` + `rewardClaims {learnerId, claimId, stickerId, gameId, createdAt}` + `learners.gameProgress[gameId]` + `learners.interests` + `learners.level` (1..100) + `learners.gameLevels` per-game 1..100, `activeLearnerId` canonical, `learnzzy.learner.v1` cache, `device learner list` via `learner.ts`, `getCachedProfile()` greeting `displayName|nickname|Explorer`, `PATCH` display-only `companion`

## 10. Required Changes (additive, no duplication)
- **Route:** Keep `/stickers` → retitle `🌳 My Living Forest` `Every reward you earn comes alive here!` (no break)
- **New world:** `LivingForestScene` + `ForestEnvironment (background/midground/foreground)` + `HabitatManager` + `LivingCreatureEngine` (`CreatureRegistry ← STICKER_CATALOG` + `StickerCreatureMapping` + `CreatureSpawner` + `BehaviorController` deterministic `IDLE→WALKING→LOOKING→DRINKING→REST` + `MovementController` + `AnimationController` + `InteractionController` tap → look + `AmbientLife` + `ForestProgressionService` unlock `tree→flowers→canopy→pond→magical` + `ForestSaveService` Mongo `forestStates`)
- **Mapping:** `StickerCreatureMapping {stickerId, creatureType, species, habitat forest|canopy|flower-garden|pond, movement walk|fly|flutter|hop, animationProfile, soundProfile}` per species (elephant walk/drink/trumpet, bird fly/land/hop/sing, butterfly flutter/land)
- **State:** `LivingCreature {id, learnerId, stickerId, species, habitat, rarity, unlockedAt, state IDLE|WALKING|FLYING|HOPPING|RESTING|LOOKING|DRINKING, position, unlocked}` persisted in `forestStates.learnerId → activeCreatures[]` + `forestEvents` queue (`CREATURE_ARRIVAL` etc.) sequential 3–8s `Skip`
- **Performance:** `maxVisibleCreatures 5–8 mobile / 8–12 normal / 15–25 desktop`, object pooling, `prefers-reduced-motion` + `isSoundMuted` respected
- **Integration:** `Game completion → reward unlocked → StickerCreatureMapping → forestEvents queue → LivingForestScene arrival (footsteps from RIGHT, jungle, sparkles, companion) → habitat → Mongo forestStates` — reuses `repositories/rewards` claim, no second reward system
