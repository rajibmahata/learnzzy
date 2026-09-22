# Curriculum Architecture — Learnzzy
**Additive, not rewrite. Framework → Stage → Subject → Outcome → Skill → Activity.**

```
Framework (CBSE, NCERT/NCF, NIPUN, CISCE, Cambridge Primary, IB PYP, Pearson iPrimary)
  ↓ Stage (Foundational 3-8, EY 3-5, P1 5-6)
    ↓ Subject (Math, English, Science, Transdisciplinary)
      ↓ Outcome (code, description, sourceReference, provenance)
        ↓ Skill (counting, addition, phonics...)
          ↓ Activity (mechanic + theme + environment + difficulty + reward)
            ↓ Assessment Evidence (accuracy, attempts, time, hints)
```

**Files:** `src/lib/curriculum/types.ts` (Zod `CurriculumFramework/Stage/Subject/Outcome/Mapping`), `registry.ts` (7 frameworks, 6 stages, 6 subjects, 4 outcomes + future extensible), `coverage.ts` (calculateCoverage/gapReport).

**Mapping:** `CurriculumMapping {activityId, frameworkId, stageId, subjectId, outcomeIds[], skills[], mappingType:direct|supporting|assessment, confidence 0..1, verifiedBy, sourceReference}` provenance `sourceUrl/retrievedAt/license`.

**Provenance:** Every outcome preserves `sourceUrl` (cbseacademic.nic.in, ncert.nic.in, cambridgeinternational.org) + `retrievedAt` + `license`; NCERT mock marked `learnzzy-native` not CBSE.

**No global level:** progression is `Framework+Stage+Subject+Skill+difficulty` per `skillLevels 1..100` + `resolveComplexity` age-banded.

**Extension:** Add framework by pushing to `CURRICULUM_FRAMEWORKS` + stages/subjects/outcomes — no game code change.
