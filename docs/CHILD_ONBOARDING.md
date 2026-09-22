# Child Onboarding

One single scrollable `/welcome` page (`LearnerSetup`) — no wizard, no tabs,
no separate screens. Sections unlock progressively as the child completes
them (locked sections show a compact teaser); no new architecture, no new
home page:

| Section | Unlocks when | Required? |
|---|---|---|
| Name (`displayName`) | Always open | No — Skip plays as explorer |
| Nickname (+ ideas) | Name done | No — falls back to name |
| Companion (10 roster friends) + name (+ ideas) | Name done | Has default (Bunny); name optional |
| Age (4–5 / 6–7 / 8–9) | Name done | Yes — sets safe complexity |
| Parent Link (Connect → `/link`) | Age chosen | No — never blocks play |
| Let's Go! (summary + START ADVENTURE) | Age chosen | — |

Rules: name and buddy are independent fields (picking a character never
overwrites the typed name). Voice buttons speak each question (calm
companion, never blocking); unlocking a section gently scrolls it into view
(instant under reduced-motion). Connect Parent and Let's Go share one guarded
create (no double learner); the second tap reuses the created profile. On
creation the learner is saved (server doc, or offline fallback), the device
list and active pointer update, a `learner_started` event fires, onboarding
is marked done via PATCH, and a one-time `welcome-{learnerId}` sticker claim
runs (idempotent — re-entry can never double-award).

Deviations from the request, decided explicitly: age bands stay
`4-5 | 6-7 | 8-9` (complexity baselines, levels, and planner are keyed on
them — a "5-6" band would fork the whole engine); no QR pairing (no QR
infrastructure exists; the pairing-code flow is unchanged).
