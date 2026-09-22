# Child Identity & Session System

## Identity

The authoritative identity is **`learnerId`**. The display name (nickname) is
optional, short (≤20 chars, sanitized server-side), stored on the learner doc,
and never used as authentication. The explorer buddy (`avatar` emoji) is a
separate display-only pick: name chips/buddies on the welcome screen never
overwrite each other, and both persist on the learner doc, cached profile, and
device list (selector shows the buddy).

- `POST /api/learners` creates a learner (works offline with an ephemeral doc).
- `GET /api/learners/{learnerId}` fetches the authoritative profile.

## Device memory (convenience only)

Namespaced localStorage keys — no secrets, no progress:

| Key | Purpose |
|---|---|
| `learnzzy.activeLearnerId` | Canonical active-learner pointer |
| `learnzzy.learnerId.v1` | Legacy pointer (kept in sync) |
| `learnzzy.learnerProfile.v1` | Cached profile for instant paint |
| `learnzzy.learners.v1` | Device learner list (≤10 entries) |
| `learnzzy.sessionId` / `learnzzy.sessionId.{learnerId}` | Legacy / per-learner session ids |

The server/database remains authoritative for progress, sessions, rewards,
stickers, and history. Local keys only remember *who* is playing.

The retired shared rewards key (`learnzzy.rewards.v1`) is adopted once into
the first learner created on the device afterwards; afterwards every learner
keeps a strictly separate collection. The sticker garden itself always renders
server data.

## apparu First-run vs returning

- **No device learners** → `/welcome` renders `LearnerSetup` ("Who is playing
  today?" + optional name + age band + grown-up link).
- **Device learners exist** → `/welcome` renders `ChildSelector`: one card per
  player ("Continue →", active marked "Welcome back! 👋") + "+ Add another
  player". Selecting a card reloads the server profile, sets the active
  pointer, and returns home.
- **Home** greets via `HomeContinue`: "Welcome back, {name}! 🌟" plus the next
  adventure when a learning plan exists.

A child is never forced to re-enter their name. The last active learner is
remembered.

## Switching learners

`setActiveLearnerId(id)` moves the pointer only — no other learner's data is
touched. Rewards, profile cache, and session ids are all namespaced per
learner, so collections, progress, journeys, and plans never mix. Each queued
game event carries the `learnerId` that was active at creation, so a switch
with a pending offline queue cannot misattribute analytics.

## Sessions

One gameplay session belongs to one learner: `getSessionId(learnerId)` keeps a
per-learner id (`learnzzy.sessionId.{learnerId}`, legacy fallback preserved).
`POST /api/game-events/batch` accepts an optional top-level `learnerId`;
`ingestEvents` stamps every event doc (per-event value wins, batch value is
the fallback) and binds `sessions.learnerId` on first sight. The `sessions`
collection itself is unchanged apart from the additive optional `learnerId`
field — there is no second session system and no server game-state machine.
Unfinished games do not auto-resume; the home "Continue Adventure" plan card
is the resume path.
