# Mini Mission Engine

## Purpose

The Mini Mission Engine adds short, deterministic 3-10 minute learning
adventures on top of Learnzzy's existing activity, progression, rewards,
analytics, voice, parent, and MCP abstractions. It does not replace the five
shipped games or the generic activity registry.

## Architecture

```text
Learner profile + age band + existing skill evidence
                         |
                         v
              MissionPlanner (deterministic)
                         |
                         v
       Approved mission template -> generated mission
                         |
                         v
              MissionPlayer + ActivityRenderer
                         |
                         v
     deterministic step validation -> mission evidence
                         |
                         v
 existing game events / learner progress / rewards / parent summaries
```

`src/lib/missionEngine.ts` owns the pure mission model, approved templates,
step generation, validation modes, skill signals, and deterministic planner
helpers. `src/services/missionPlanner.ts` consumes the existing learner age
band, global level, per-skill evaluation, and recent mission evidence. It does
not create a second level system.

`src/repositories/missions.ts` owns the MongoDB boundary. The five mission
collections are additive:

- `missions`: generated/approved mission definitions.
- `missionTemplates`: approved template metadata and version.
- `missionAttempts`: resumable attempt state and completion/reward idempotency.
- `missionSteps`: persisted generated step definitions for server validation.
- `learnerMissionProgress`: aggregated step evidence and skill practice signals.

When MongoDB is unavailable, approved templates and deterministic generation
still serve gameplay. Durable attempts and parent aggregates degrade gracefully.
Mission rewards are derived from server-validated step evidence; the browser
cannot choose the awarded star count.

Mission completion writes the shared progression record through the single
structured result path: `gameProgress` under the mission `gameType`
(`mission-memory`, `mission-sort`, `mission-phonics`, `mission-word-change`,
`mission-observation`), interests, `totalStars`, and the `lastResult`
projection, plus one promotion/skill step per granted reward. Mission practice
is therefore visible to adaptive levels, parent per-game views, and the
planner; it never creates a second level system. Starting a mission resumes an
already-started attempt instead of opening concurrent ones, and mission starts
(not step submissions) drive the progress `attempts` counter. Guest practice
stays in the attempt and never pollutes shared aggregates.

## First Mission Templates

The first five templates are:

- Remember & Find: memory and observation.
- Sort & Group: classification and flexible thinking.
- Build the Word: phonics and sequencing.
- Change One Thing: word transformation and multiple valid responses.
- Find the Difference: observation and problem solving.

Each template generates three small steps. The generated step uses one of the
reusable primitives (`remember`, `find`, `match`, `sort`, `sequence`, `choose`,
`build_word`, `change_word`, `trace`, `draw`, `count`, `compare`, `solve`, or
`create`). `ActivityRenderer` dispatches primitives without modal-dependent
interaction.

## Validation and Evidence

Validation modes are deterministic:

- `exact`: normalized scalar equality.
- `set`: order-independent set equality.
- `sequence`: ordered list equality.
- `multiple_valid`: response matches any approved response set.
- `open_ended`: non-empty interaction evidence is sufficient; artistic quality
  is never scored.

Every submitted step records learner, mission, step, skill, difficulty,
correctness, attempts, response time, hints, completion, content ID, timestamp,
and optional strategy/interaction evidence. Client values are request hints;
the server regenerates or loads the mission step and validates the response.

Flexible-thinking steps preserve `strategyUsed` and accepted alternatives.
Steps that offer `strategyOptions` render a "How will you try it?" picker;
the chosen strategy travels top-level in the step result and is stored on the
evidence alongside interaction evidence. Creative steps record completion,
attempted state, selected elements, and variation evidence rather than an
intelligence or quality score.

Change One Thing rounds are generated from the seeded word families: base
words are chosen deterministically per seed from words with three or more
one-letter variants, distractors are same-length non-variants, and the offered
strategies reflect which word positions actually vary. Find the Difference
rounds are drawn per seed from a nine-set pool. The completion screen shows
the server-derived star award.

## API

- `GET /api/missions`: deterministic age-appropriate mission recommendations.
- `GET /api/missions/{missionId}`: generated mission definition.
- `POST /api/missions/{missionId}/attempt`: start or complete an attempt.
- `POST /api/missions/{missionId}/steps/{stepId}/result`: validate one step.
- `GET /api/learners/{learnerId}/mission-progress`: learner mission evidence.
- `GET /api/learners/{learnerId}/adventure`: today's deterministic adventure.
- `GET /api/parent/children/{childId}/missions`: authorized parent summary.

Existing `GET /api/learners/{learnerId}/skills` remains the canonical per-game
skill endpoint and now includes additive `missionSkills` evidence. The dedicated
`GET /api/learners/{learnerId}/mission-progress` projection and parent mission
summary expose the same skill-practice aggregates without creating an IQ score.

## AI and MCP

No LLM or MCP call is required during mission play. Future content, quality,
difficulty, personalization, QA, and asset agents may propose templates, but
all output must pass schema, safety, and deterministic validation before it can
be approved. The Education Gateway remains advisory and fail-closed.

## Verification Scope

Unit tests cover template validation, age-band restrictions, exact/set/sequence/
multiple-valid/open-ended validation, evidence aggregation, completion, phonics
families, one-letter variant generation, seeded difference pools,
recent-template planning, and deterministic planning. Playwright covers
Today's Adventure, all five mission entry points, responsive mobile/tablet/
desktop layout, and completion (20/20 across four projects). Mission listing,
attempt, step-result, adventure, and mission-progress routes are rate-limited
like the rest of the child API surface.

Open production checks remain live-Mongo E2E, physical devices, neural TTS
assets, and Stitch validation for the new mission surfaces.
