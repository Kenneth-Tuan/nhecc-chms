# Skill health rubric

Criteria distilled from [Agent Skills creation guides](https://agentskills.io/skill-creation/). Use with static `audit-skill.mjs` output and a full read of the target `SKILL.md`.

## Severity

| Level        | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| **Critical** | Spec violation or likely wrong activation / failed runs |
| **Major**    | Hurts reliability, context cost, or maintainability     |
| **Minor**    | Improvement opportunity                                 |
| **Info**     | Optional maturity (evals, gotchas, scripts polish)      |

## 1. Structure & spec (quickstart / specification)

| Check                    | Pass                                 | Fail               |
| ------------------------ | ------------------------------------ | ------------------ |
| `SKILL.md` at skill root | Present                              | Missing            |
| `name` in frontmatter    | Matches folder, `a-z0-9-`, ≤64 chars | Mismatch / invalid |
| `description`            | Non-empty, ≤1024 chars               | Missing / too long |
| Folder name              | Same as `name`                       | Drift              |

## 2. Description & triggering (optimizing-descriptions)

Score each 1–5 after reading only frontmatter, then the full body:

- **Intent coverage**: WHAT + WHEN; user goals not implementation details.
- **Trigger phrasing**: Imperative “Use when…” (or equivalent); not only “This skill does…”.
- **Precision**: Broad enough for real tasks, narrow enough to avoid adjacent skills (near-miss boundaries).
- **Voice**: Third person; not “I can” / “You can”.
- **Progressive disclosure fit**: Description sells activation; body holds procedure.

**Red flags**

- Description is a one-liner with no WHEN.
- Description lists every file in the repo (over-broad → false triggers).
- Description duplicates the entire workflow (wastes discovery slot).

**Suggested eval set** (manual, 5–10 prompts): mix should-trigger / should-not-trigger; include one near-miss. See optimizing-descriptions train/validation split if iterating description.

## 3. Body & best practices

| Area                       | Healthy                                                         | Unhealthy                                     |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| **Context budget**         | Only what the agent lacks; project-specific                     | Explains HTTP, PDF, git basics                |
| **Scope**                  | One coherent unit of work                                       | DB admin + querying + formatting in one skill |
| **Detail level**           | Stepwise procedure + one example                                | Exhaustive edge-case encyclopedia             |
| **Progressive disclosure** | Core in `SKILL.md`; detail in `references/` with _when to read_ | 500+ line monolith or orphan reference files  |
| **Control calibration**    | Prescriptive for fragile ops; flexible with _why_ elsewhere     | All rigid or all vague                        |
| **Defaults**               | One default tool/approach + brief escape hatch                  | Menu of equal options                         |
| **Procedures**             | Reusable method                                                 | Single-instance answer (“join orders on…”)    |
| **Gotchas**                | Concrete env/project corrections                                | “Handle errors appropriately”                 |
| **Output**                 | Template in `SKILL.md` or `assets/` when format matters         | Prose-only format spec                        |
| **Multi-step**             | Checklist or numbered workflow with validation gates            | Implicit steps                                |
| **Validation**             | Run script / re-check until pass                                | “Make sure it’s correct”                      |

## 4. Scripts (using-scripts)

| Check                    | Notes                                                      |
| ------------------------ | ---------------------------------------------------------- |
| Documented in `SKILL.md` | List under “Available scripts” with purpose                |
| Paths                    | Relative to skill root (`scripts/foo.mjs`)                 |
| Agent-safe               | No interactive prompts; clear errors; `--help`             |
| Output                   | Structured stdout; diagnostics stderr                      |
| Size                     | Summaries or pagination if output can truncate context     |
| Bundled vs one-off       | Complex → `scripts/`; simple pinned `npx`/`uvx` in body OK |

## 5. Evals & iteration (evaluating-skills)

| Maturity | Signal                                                |
| -------- | ----------------------------------------------------- |
| None     | No `evals/evals.json`                                 |
| Basic    | 2–3 realistic prompts + expected_output               |
| Strong   | Assertions; with/without skill runs; benchmark deltas |

Recommend: after changing description or workflow, add or rerun evals; grade with evidence, not vibes.

## 6. Scoring (overall health)

Compute **dimension scores** (0–100) from checklist + judgment:

1. **Spec compliance** — errors from `audit-skill.mjs` weigh heavily.
2. **Discoverability** — description quality + false-trigger risk.
3. **Executability** — clear steps, scripts, validation loops.
4. **Maintainability** — length, disclosure, no time-bombs, consistent terms.
5. **Evidence** — evals/snapshots/scripts tested in repo.

**Overall**

- **Healthy (85–100)**: No critical; ≤1 major; scripts/evals optional but present for complex skills.
- **Needs work (60–84)**: Major issues fixable in one editing pass.
- **At risk (&lt;60)**: Critical spec failures, or body so vague/large that activation/execution fails often.

## 7. Remediation priority

1. Fix **critical** spec (name, description, missing `SKILL.md`).
2. Rewrite **description** (highest ROI for triggering).
3. Trim / split **SKILL.md** → `references/` with load triggers.
4. Add **gotchas** from real agent mistakes.
5. Document and harden **scripts**; add **evals** for regression.
