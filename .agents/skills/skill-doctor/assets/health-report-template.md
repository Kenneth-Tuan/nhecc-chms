# Skill health report: [skill-name]

**Target:** `[path/to/skill/]`  
**Audited:** [ISO date]  
**Overall:** [Healthy | Needs work | At risk] — **[score]/100**

## Executive summary

[2–4 sentences: activation risk, biggest gap, top fix.]

## Static audit

```json
[paste audit-skill.mjs JSON summary or key findings]
```

| Metric                   | Value |
| ------------------------ | ----- |
| SKILL.md lines           |       |
| Description chars        |       |
| errors / warnings / info |       |

## Dimension scores

| Dimension                | Score | Notes |
| ------------------------ | ----: | ----- |
| Spec compliance          |       |       |
| Discoverability          |       |       |
| Executability            |       |       |
| Maintainability          |       |       |
| Evidence (evals/scripts) |       |       |

## Findings

### Critical

- [ ] …

### Major

- [ ] …

### Minor

- [ ] …

### Info

- …

## Description review

**Current:**

> [quote description]

| Criterion            | OK? | Note |
| -------------------- | --- | ---- |
| WHAT + WHEN          |     |      |
| Third person         |     |      |
| Trigger breadth      |     |      |
| Near-miss boundaries |     |      |

**Suggested description** (if rewrite warranted, ≤1024 chars):

```yaml
description: >
  …
```

## Body review

- **Strengths:** …
- **Gaps:** …
- **Progressive disclosure:** …
- **Gotchas / checklist / templates:** …

## Scripts & evals

| Asset              | Status | Action |
| ------------------ | ------ | ------ |
| `scripts/`         |        |        |
| `references/`      |        |        |
| `evals/evals.json` |        |        |

## Suggested eval prompts (optional)

| #   | Prompt | should_trigger |
| --- | ------ | -------------- |
| 1   |        | true/false     |

## Remediation plan (ordered)

1. …
2. …
3. …

## References

- [Quickstart](https://agentskills.io/skill-creation/quickstart.md)
- [Best practices](https://agentskills.io/skill-creation/best-practices.md)
- [Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions.md)
- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills.md)
- [Using scripts](https://agentskills.io/skill-creation/using-scripts.md)
