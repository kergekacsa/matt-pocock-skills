# Output Format

The single source of truth for the devil's-advocate full report. Used by the `devils-advocate` skill (inline reviews and delegated synthesis) and the `devils-advocate` agent's standalone path. Follow it exactly — this is a contract, not a style guide.

## Structure (fixed order)

Render every section below as a real Markdown header, bold text inside the hashes so
it degrades gracefully on clients that ignore `#` syntax — never a bullet with bold
text standing in for a heading:

```
## **✅ What Holds Up**
## **🔴 Critical Issues (Must Address)**
## **🟠 Major Concerns (Should Address)**
## **🟡 Assumptions Under Challenge**
## **🔵 Blind Spots & Missing Considerations**
## **⚪ Hallucination Risk Flags**
## **🔄 Strongest Counterargument**
## **📋 Recommended Actions**
## **➕ Held back**
## **🏁 Verdict**
```

The bold span wraps the icon and the words together — matching the global
`## **Header text**` session-header convention exactly, not just the words after the
icon.

Order is fixed, top to bottom, exactly as shown. Each header is a section break in
appearance only — it never resets the numbered sequence (see Numbering below); the
first item under a header continues from whatever number the previous category left
off at. What goes under each header:

- **✅ What Holds Up** (steel-man first) — your steel-man, lead with it. Be intellectually honest: acknowledge what is well-reasoned, correct, or appropriately caveated. Critique without nihilism. Prose or one-line bullets. **Not numbered** — this isn't a concern needing an action.
- **🔴 Critical Issues (Must Address)** — blocks correctness, security, or safety; blockers.
- **🟠 Major Concerns (Should Address)** — significant design flaw, missing requirement, or likely bug.
- **🟡 Assumptions Under Challenge** — explicit list of assumptions identified, each with your challenge to it.
- **🔵 Blind Spots & Missing Considerations** — what wasn't addressed that should have been.
- **⚪ Hallucination Risk Flags** — specific claims that stay unverifiable after you tried to check them.
- **🔄 Strongest Counterargument** — the most compelling case against the main conclusion. Prose, one paragraph. **Not numbered.**
- **📋 Recommended Actions** — every numbered item from the five categories above, mirrored row-for-row.
- **➕ Held back** — one line, only if the global cap trimmed anything.
- **🏁 Verdict** (last line) — Ship it / Ship with changes / Rethink it. Always the final line of the report.

Omit any of Critical, Major, Assumptions, Blind Spots, or Hallucination Risk Flags that genuinely has nothing — don't pad with "none found." Always keep ✅ What Holds Up, 📋 Recommended Actions, and the 🏁 Verdict.

## Numbering

- **One continuous sequence** for the whole report: Critical → Major → Assumptions → Blind Spots → Hallucination, in that order. Numbers do not restart per category.
- **The category headers are not list boundaries.** Each category now renders as its own `##` header (see Structure above); that visual break is cosmetic only. The first item under "Assumptions Under Challenge" is never `1.` unless Assumptions is the *first* category in the report with any items — if Critical/Major already used numbers 1–5, Assumptions starts at `6`, and Blind Spots' first item continues from wherever Assumptions ended, not from `1` again.
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

`N` below is always a placeholder for "the next number in the report's single running
sequence" — never copy it as a literal `1`. A Major item is never `1.` unless it is
genuinely the first numbered item in the entire report (i.e. Critical had zero items).
If Critical already used 1–2, the first Major item is `3.`, the first Assumption after
that continues from there, and so on — see Numbering above.

**Critical / Major** — full expansion, attributed to the lens that found it:

```
N. **[concern in one line]** — Critical · Blocking: Yes
   - **Surfaced by:** [lens / framework]
   - **What I see:** [specific — cite files, lines, claims]
   - **Why it matters:** [the consequence if it ships as-is]
   - **Action:** [specific, actionable]
```

Severity is `Critical` or `Major`. Blocking is judged per item, honestly — never inflated.

**Assumptions / Blind Spots / Hallucination Risk Flags** — terse, one line, no sub-bullet expansion:

```
N. [assumption / blind spot / unconfirmed claim, one line] — Action: [specific step] · Blocking: No
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
