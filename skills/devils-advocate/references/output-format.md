# Output Format

The single source of truth for the devil's-advocate full report. Used by the `devils-advocate` skill (inline reviews and delegated synthesis) and the `devils-advocate` agent's standalone path. Follow it exactly — this is a contract, not a style guide.

## Structure (fixed order)

- ✅ **What Holds Up** (steel-man first) — your steel-man, lead with it. Be intellectually honest: acknowledge what is well-reasoned, correct, or appropriately caveated. Critique without nihilism. Prose or one-line bullets. **Not numbered** — this isn't a concern needing an action.
- 🔴 **Critical Issues (Must Address)** — blocks correctness, security, or safety; blockers.
- 🟠 **Major Concerns (Should Address)** — significant design flaw, missing requirement, or likely bug.
- 🟡 **Assumptions Under Challenge** — explicit list of assumptions identified, each with your challenge to it.
- 🔵 **Blind Spots & Missing Considerations** — what wasn't addressed that should have been.
- ⚪ **Hallucination Risk Flags** — specific claims that stay unverifiable after you tried to check them.
- 🔄 **Strongest Counterargument** — the most compelling case against the main conclusion. Prose, one paragraph. **Not numbered.**
- 📋 **Recommended Actions** — every numbered item from the five categories above, mirrored row-for-row.
- ➕ **Held back** — one line, only if the global cap trimmed anything.
- 🏁 **Verdict** (last line) — Ship it / Ship with changes / Rethink it. Always the final line of the report.

Omit any of Critical, Major, Assumptions, Blind Spots, or Hallucination Risk Flags that genuinely has nothing — don't pad with "none found." Always keep ✅ What Holds Up, 📋 Recommended Actions, and the 🏁 Verdict.

## Numbering

- **One continuous sequence** for the whole report: Critical → Major → Assumptions → Blind Spots → Hallucination, in that order. Numbers do not restart per category.
- Numbers are assigned to the **final rendered set only**, after the global cap (below) is applied — no gaps.
- The Recommended Actions table reuses these exact numbers, in the same order.
- Numbering happens once, during final synthesis/rendering — never at the per-lens dispatch stage (see "Never surface per-lens output" below).

## Global cap: 10

- At most **10 numbered items** in the whole report, pooled across all five categories — not 10 per category.
- **Fill order when trimming:** Critical first, then Major, then remaining slots go to Assumptions/Blind Spots/Hallucination ranked by impact. A Critical finding is never bumped by an item from a lower category.
- Applies whether the report was produced inline (small, self-contained target) or by synthesizing delegated subagent findings — one format, one cap, regardless of path.
- If more than 10 were found, surface the 10 that matter most and add the `➕ Held back` line with the exact count omitted — never drop findings silently:
  `+N lower-priority findings not shown across all categories — ask to see them.`

## Item format

**Critical / Major** — full expansion, attributed to the lens that found it:

```
1. **[concern in one line]** — Critical · Blocking: Yes
   - **Surfaced by:** [lens / framework]
   - **What I see:** [specific — cite files, lines, claims]
   - **Why it matters:** [the consequence if it ships as-is]
   - **Action:** [specific, actionable]
```

Severity is `Critical` or `Major`. Blocking is judged per item, honestly — never inflated.

**Assumptions / Blind Spots / Hallucination Risk Flags** — terse, one line, no sub-bullet expansion:

```
6. [assumption / blind spot / unconfirmed claim, one line] — Action: [specific step] · Blocking: No
```

These three categories have no severity rubric, so **Blocking is always `No`** for them by definition — only Critical/Major items can ever read `Blocking: Yes`. Still give each a concrete Action; if there's genuinely no "what to do," drop the item (every concern must be actionable).

Render every concern as a bullet or numbered list item — **never a code block.**

## Recommended Actions table

Every numbered item from every category, mirrored row-for-row, same numbers, same order:

| # | Action | Blocking? |
|---|---|---|
| 1 | [same Action text as item 1] | Yes / No |

## Never surface per-lens output

When the skill dispatches parallel `devils-advocate` lens-agents, each lens's raw bullets are an input to synthesis, not something to show the user. Only the final synthesized report — numbered, capped, verdict at the bottom — is ever displayed in chat.
