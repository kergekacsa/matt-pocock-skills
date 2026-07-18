# Full Review — No-Diff Mode Guide (Steps 2–7a)

For a directory, module, or explicit file-list target — Step 1 (in `SKILL.md`) already
resolved `diff = no` and the scope. Steps 8–9 (adversarial challenge, aggregate report)
apply the same way to both modes and stay in `SKILL.md`; only the per-dimension checks
below differ from `diff-review-guide.md`.

### 2. Functional correctness

Run the test suite scoped to the target path where the project's test runner supports
path/package filtering (e.g. `pytest src/auth/`, `go test ./auth/...`, a workspace
filter for a monorepo package) — a small scope inside a large monorepo shouldn't pay for
the whole suite. Fall back to the full project suite, with a stated reason, only when
the runner can't be scoped that way. This still runs unconditionally, same as diff mode,
including the same "`verify` unavailable → say so, rely on the suite alone" fallback —
and the same "no test suite/build exists at all → say so and mark not applicable, never
fabricate a result" fallback for a scope with nothing executable (e.g. a directory of
pure markdown/docs).
For the `verify` half: first determine whether the scope has a **runtime surface** — something
invocable and observable, not just readable (route handlers, an exported CLI, a
renderable UI component, a message-queue consumer, a `main()`/entrypoint, or a
library/module's exported public functions and classes). Decide this concretely — grep
for exported symbols, route/command/component definitions, or a framework entrypoint
pattern; if genuinely unclear, ask the user — rather than eyeballing it. If none exists
(e.g. a directory of pure types, interfaces, or config), skip `verify` and say so —
there's nothing to drive. If one exists, use `verify` to exercise the scope's main
flows end-to-end and observe behavior — not "did this change work" (there's no change),
but "does this still work right now": hit the main endpoints, run the main commands,
render the main components, or call the exported functions directly, whichever applies
to the scope. Report what was exercised and what was observed.

This gate is deliberately external rather than left to `verify` itself: `verify`'s own
skip-guard is diff-framed, targeting diffs with no runtime surface to drive, so it won't
reliably self-fire in a no-diff context — this delta exists because that guard doesn't
apply here.

### 3. Spec compliance

There's no "before" to check requirements against, so the diff-relative check in
`diff-review-guide.md` doesn't apply. Instead, look for a design doc or PRD describing
this scope specifically (a `README.md` inside the scope, or a doc under `docs/`,
`specs/`, or `.scratch/` matching the scope's name). If none exists, this step is
vacuous — say so and skip. If one exists, check whether the scope's **current**
implementation fulfills it: report (a) documented behavior missing or partial, (b)
undocumented capability beyond what the doc describes, (c) documented behavior that
looks implemented but wrong — same three-part shape as the diff-relative check, just
evaluated against current state instead of a diff.

This step has no Acceptance Criteria sub-check analog — that sub-check is inherently
diff-relative (see `diff-review-guide.md` Step 3).

### 4. Documentation completeness

Switch to an audit mode — instead of checking whether *this* change kept docs current,
check whether the scope's **existing** documentation matches its **current actual**
behavior, regardless of when any mismatch was introduced. This catches drift
accumulated across many past changes that a single-diff check would never see. Flag:
(a) documented behavior with no corresponding actual behavior, (b) a doc that
contradicts current behavior, (c) a command/skill/script present in the scope without
being listed alongside its siblings wherever similar items are already listed — same
flag categories as the diff-relative check, read as static facts about the current
state rather than about a diff.

### 5. Code quality and decay risks

`/brooks-review`'s own Auto Scope Detection is diff-only (`git diff --cached` →
`git diff` → `git diff main...HEAD` → ask user), with no whole-project fallback, so it
can't run here. Delegate instead to `/brooks-debt` on the scope, respecting
`.gitignore` the same way `SKILL.md` Step 1's directory resolution does — it scans the
same six decay risks (R1–R6) and defaults to the entire target when no diff exists.
Present its findings verbatim under this section, but note: this is not a like-for-like
substitution. `/brooks-debt` appends a Pain × Spread Debt Summary Table (absent from
`/brooks-review`'s output) and scans exhaustively with no diff-relative skip-guards,
versus `/brooks-review`'s change-framed, guard-suppressed scan — the same section label
can carry a different lens depending on which delegate ran, and the report should make
that visible rather than implying format identity.

`/brooks-debt`'s own scan is uncapped by design ("list every finding before scoring").
The same display cap as `diff-review-guide.md` Step 5 applies here too — the full scan
still runs, but presentation caps at the 7 highest-priority findings (by Pain × Spread),
with a "+N further findings not shown — ask to see them" line, and the full per-risk
counts still shown in the Debt Summary Table.

### 6. Test quality

Always run `/brooks-test` on the scope — there's no diff-based trigger to evaluate,
and reviewing a whole directory/module implicitly puts its test quality in scope —
unless the scope genuinely has no tests or test framework (e.g. a pure markdown/docs
directory), in which case say so explicitly and skip rather than running `/brooks-test`
against nothing.

### 7. Architecture impact

Always run `/brooks-audit` on the scope — reviewing a whole directory/module is
inherently an architecture-relevant scope, and there's no diff-based trigger to
evaluate.

### 7a. UI/UX quality

Run `/ux-expert` in audit mode if the scope contains a rendered UI surface — a page,
view, or renderable component (decide concretely, the same way Step 2 determines a
runtime surface). Skip for a scope with no UI (pure backend, types, config, or docs) and
say so. `/ux-expert` audits the scope's current UI across its 8 UX dimensions, rating
each finding Critical/Major/Minor/Enhancement; present its findings verbatim under this
section. Constrain it to its audit phases (Understand + Audit) — never enter the
redesign/spec phases here.
