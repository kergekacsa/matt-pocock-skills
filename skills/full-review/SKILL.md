---
name: full-review
description: >
  Read-only technical gate for any code scope — a PR, a commit range, uncommitted
  changes, a whole directory or module, or an explicit file list — across every
  technical dimension: does it work, does it match spec (or its own design doc, for a
  whole-scope review), is the documentation current, is it clean, are the tests good,
  does it respect architecture. Delegates each dimension to the skill that already owns
  it, then aggregates into one report.
  Triggers when: user wants a full/complete technical review of a PR, diff, directory,
  or module, or asks "is this safe to merge".
  Do NOT trigger for: (1) closing out your own session's work — use `/wrap-up`, which
  checks that this skill ran and handles the commit/tracker steps this skill
  deliberately never does; (2) a single-dimension check — use `/brooks-review`,
  `/brooks-debt`, `/brooks-test`, `/brooks-audit`, or `/code-review-matt` directly when only
  one angle is wanted; (3) reviewing a GitHub PR through the built-in reviewer — use
  `/review`, unless the deeper multi-dimension pass here is specifically wanted; (4) a
  quick composite health-score dashboard for a directory/module — use `/brooks-health`,
  which runs abbreviated, capped scans across the same underlying dimensions for a fast
  score. Reserve this skill's no-diff mode for when the full-depth pass, mandatory
  adversarial challenge, or the design-doc/doc-drift audits are specifically wanted, not
  just a number.
---

# Full Review

Read-only technical gate for any code scope. Every dimension below is delegated to the
skill that already owns it — this skill never re-implements a check another skill
provides, and never runs two skills that would find the same thing twice.

## Non-negotiable

- **Never mutate.** No Edit/Write to the target's files, no git commit, no tracker
  update. If a mutation looks warranted, say so in the report and point at `/wrap-up`
  or the relevant skill's own `--fix` mode — don't do it here. This guarantee covers the
  target's files, git, and the tracker only — it does not extend to side effects of a
  delegated step itself: running the test suite executes real code, `verify` (where
  available) may exercise live endpoints/commands or write a one-time bootstrap file of
  its own, and `/brooks-review`/`/brooks-debt`'s shared framework writes its own
  bookkeeping files as normal operation — appending a run record to
  `.brooks-lint-history.json` after every scan, and, if a triage session happens,
  dismissed findings to `.brooks-lint.yaml`. Those are the delegate's normal operation,
  not a violation of this rule — they're tooling metadata about the review, not the
  target's code, git history, or tracker state — but don't describe this skill as fully
  inert — it isn't.
- **Never duplicate a delegated check.** If `/brooks-review` or `/brooks-debt` ran
  (whichever Step 5, in the mode guide, delegated to), do not also run
  `code-review-matt`'s Standards axis — see Step 3 (in the mode guide) for how Spec
  compliance is checked without re-running it. And never run both `/brooks-review` and
  `/brooks-debt` for the same scope — Step 5 (in the mode guide) picks exactly one based
  on whether a diff exists.
- **Skip conditional steps honestly.** If a step is skipped, say so and say why in the
  report — never silently omit it.

## Process

Step 1 below resolves which mode applies. Steps 2–7a — the per-dimension checks — live
in two sibling guides so each mode's process stays self-contained instead of threading
`diff`-branches through every step: `diff-review-guide.md` for the diff path (PR /
commit range / uncommitted changes — the primary use case), `no-diff-review-guide.md`
for a whole-scope target (directory / module / file list). Steps 8–9 (adversarial
challenge, aggregate report) apply the same way to both modes and stay below.

The two guides share the same seven step headings by design (Steps 2–7a, same order,
same names) — when a change alters what one of those steps means or covers, apply the
same conceptual change to its counterpart in the other guide, even though the two
bodies diverge in mode-specific detail.

### 1. Pin the fixed point

Resolve whatever the user points you at into two facts every later step needs: a
**scope** (which files) and whether a **diff** exists. Named target types, each
resolving to those two facts:

- **PR / commit range / branch / tag** — capture `git diff <fixed-point>...HEAD`
  (three-dot, against the merge-base) and `git log <fixed-point>..HEAD --oneline`.
  Confirm the fixed point resolves (`git rev-parse <fixed-point>`). → scope = changed
  files, diff = yes **only if that diff is actually non-empty**. If it's empty (e.g. a
  net-zero PR after a revert), stop here and report "no net change in this fixed point —
  nothing to review," skipping **every** later step (2 through 9, including Step 8's
  adversarial challenge) rather than running any of them against nothing — the "never
  skipped outright" rule at Step 8 presumes a non-empty target; an empty fixed point is
  reported and closed, not challenged.
- **Uncommitted / staged changes** — if the user gave no fixed point, apply the same
  Auto Scope Detection as `/brooks-review`: `git diff --cached` → `git diff` →
  `git diff main...HEAD` → ask. → scope = changed files, diff = yes under the same
  non-empty condition above (same full stop — Steps 2 through 9 — if it turns out empty).
- **Directory or module** — a path. → scope = every file under that path (respecting
  `.gitignore`), diff = no. **If that path also has uncommitted changes inside it**, ask
  which the user wants (review the uncommitted diff, or the directory's current state)
  rather than silently picking one — the two are legitimately different reviews of the
  same files.
- **Explicit file list** — specific files named or pasted, not necessarily co-located.
  → scope = exactly those files, diff = no (unless the user separately frames them as a
  change against a known prior state).

State which type was resolved, the resolved **mode** (`diff` or `no-diff`), and the
scope line — e.g. `Mode: diff — Scope: PR #42 (7 files, ~180 lines changed)` or
`Mode: no-diff — Scope: directory review — src/auth/ (14 files)`. Stating the mode
explicitly here, not just implicitly via which guide gets read next, is what makes a
misroute visible in the report instead of silently swapping the whole check set.

This **diff** fact — not the named type directly — is what selects the guide for
Steps 2–7a: a diff exists for PR/commit-range/uncommitted targets, and doesn't for
directory/module/file-list targets.

**Trivial-diff fast lane.** The file-count and line-change signal captured above isn't
only for Step 8's right-sizing (below) — for a genuinely trivial diff (a handful of
lines, no behavioral consequence), Step 3's spec check may skip the subagent and check
inline instead, and Step 5 needs no separate fast lane at all: `/brooks-review`'s own
scope-calibration rules already scale its scan down for small diffs (see its guide's
"Scope calibration" — this is depth calibration `/brooks-review` already owns, not a
cap full-review adds on top). State explicitly when a step right-sizes this way and
why — never silently skip a dimension outright.

### 2–7a. Dimension checks

Read `diff-review-guide.md` (diff = yes) or `no-diff-review-guide.md` (diff = no) in
this directory and follow its Steps 2–7a in order: functional correctness, spec
compliance, documentation completeness, code quality and decay risks, test quality,
architecture impact, and UI/UX quality (Step 7a, only when the change touches a rendered
UI surface).

### 8. Adversarial challenge

Run `/da-review` on every review — this is not optional. Give it a concrete target and
an explicit size signal (the file count, and for a diff target the line-change count,
that Step 1 already resolved) — never hand it only "everything gathered" with no
underlying files or size context to work from. The target itself: for a diff target,
the diff plus everything gathered in Steps 2–7a as context; for a no-diff target, the
scope's current source files themselves, with everything gathered in Steps 2–7a passed as
prior context to challenge. For a genuinely trivial diff (a handful of modified lines,
no behavioral consequence) or a small no-diff scope (a handful of files), `/da-review`
right-sizes itself to an inline challenge rather than a delegated multi-lens pass, per
`devils-advocate`'s own rule ("Challenge small, self-contained targets inline... Don't
spin up a subagent for a one-liner") — passing the size signal explicitly lets it make
that call on real numbers instead of inferring from an unmeasured file set. It is never
skipped outright. Note whether it ran inline or delegated, and why.

### 9. Aggregate report

One report, sectioned exactly as above in order, omitting any step that was skipped
(with a one-line reason). Close with a single paragraph stating whether every checked
dimension came back clean. This skill states facts, not a merge decision — the human or
calling process decides whether to merge; this report just says what each dimension
found.
