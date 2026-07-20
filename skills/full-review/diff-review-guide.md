# Full Review — Diff Mode Guide (Steps 2–7a)

For a PR, commit range, branch/tag, or uncommitted/staged changes — Step 1 (in
`SKILL.md`) already resolved `diff = yes` and the scope. Steps 8–9 (adversarial
challenge, aggregate report) apply the same way to both modes and stay in `SKILL.md`;
only the per-dimension checks below differ from `no-diff-review-guide.md`.

### 2. Functional correctness

- Run the project's real test suite. Record pass/fail — don't proceed past a failing
  suite without flagging it as a blocker in the final report. If the project has no
  test suite and no invocable build (e.g. a documentation/markdown-only repo with
  nothing executable), say so explicitly and mark this dimension not applicable —
  never imply a pass or fabricate a result for a suite that doesn't exist.
- If a `verify` skill is available in this environment, invoke it to exercise the change
  end-to-end. If it isn't available, say so explicitly in the report and rely on the
  test suite alone — never imply an end-to-end pass that didn't happen.

### 3. Spec compliance

Identify the spec source using the same method as `/code-review-matt` Step 2: issue
references in commit messages, a path the user passed, or a PRD/spec file under
`docs/`, `specs/`, or `.scratch/` matching the branch name. If nothing is found, ask;
if the user confirms there is no spec, skip this step and note it.

Spawn **one** subagent with `/code-review-matt`'s Spec sub-agent brief — report
(a) requirements missing or partial, (b) unasked-for scope creep, (c) requirements that
look implemented but wrong, each with a spec-line citation. Do **not** spawn or reuse
`code-review-matt`'s Standards sub-agent — that axis is covered more thoroughly by Step 5,
and running both would report the same smells twice.

**Acceptance criteria — checked separately from the generic spec, always emitted.**
`code-review-matt`'s Spec brief only checks whatever document resolved as "the spec" above —
it has no explicit instruction to extract a ticket's Acceptance Criteria, and if the
spec source resolves to a PRD file rather than the ticket, the ticket's ACs are never
checked by it at all. So: look up the tracker ticket for this change, if any, and report
a **"Acceptance Criteria coverage"** sub-section **every time** — never omit it — stating
explicitly which of these applies:

- **No ticket** — no tracker ticket found for this change.
- **No AC section** — a ticket exists but has no Acceptance Criteria section.
- **AC status** — a ticket with an AC section exists: extract it and check each AC
  individually against the diff, regardless of what the generic spec source above turned
  out to be, and report per-AC status (met / partial / unaddressed), quoting each AC.

This is the only place AC coverage is derived — `/wrap-up` consumes this section rather
than re-deriving it, and relies on the reason always being stated explicitly to tell "no
ticket" apart from "ticket with no AC section" apart from a ticket whose ACs were
actually evaluated. This sub-check has no no-diff analog — see
`no-diff-review-guide.md` for how Step 3 maps to a whole-scope review instead.

### 4. Documentation completeness

For every behavioral change in the diff, identify the docs that describe that behavior
— README, CLAUDE.md and the files it references (e.g. `references/`), inline comments,
API docs, and any HTML pages. Check whether each was actually updated to match. Flag:
(a) changed behavior with no corresponding doc update, (b) a doc that now contradicts
the new behavior, (c) a new command/skill/script added without being listed alongside
its siblings wherever similar items are already listed. This mirrors the repo's own
"Documentation stays current" rule — outdated documentation is a bug, not a nice-to-have.
If nothing in the diff changes documented or user-visible behavior, say so and skip.

### 5. Code quality and decay risks

Delegate fully to `/brooks-review` on the same fixed-point scope. Present its findings
verbatim under this section — do not re-derive or re-summarize them. `/brooks-review`
applies no *finding-count* cap of its own (this is the full-depth pass, not
`/brooks-health`'s abbreviated dashboard) — but it does calibrate scan *depth* by PR
size under its own scope-calibration rules (a small diff gets a narrower step range, a
large diff gets sampled rather than exhaustive coverage); that calibration is
`/brooks-review`'s own and this section doesn't override or hide it. On top of whatever
depth `/brooks-review` chose, this skill only caps *presentation*: if it returns more
than 7 findings, display the 7 highest-severity ones and add "+N further findings not
shown — ask to see them" (same convention as `/da-review`'s own synthesis). Never drop
findings silently, and never truncate the underlying scan to produce this — cap
display, not depth.

### 6. Test quality

Run `/brooks-test` only if the diff touches test files, or adds production code with no
corresponding test changes. Skip for docs-only, config-only, or test-untouched diffs,
and say so.

### 7. Architecture impact

Run `/brooks-audit` (with `--since=<fixed-point>` for an incremental audit) only if the
diff crosses module boundaries, changes an import direction, or restructures
directories. For a routine same-module change, skip this — `/brooks-review`'s own R5
(Dependency Disorder) check already covers local dependency-direction issues, and a full
audit would be redundant with it.

### 7a. UI/UX quality

**Step A — Detect a rendered UI surface.** Grep the diff for component/route definitions,
template or JSX changes, page or view files. If found, run `/ux-expert` in audit mode on
the changed surface. `/ux-expert` audits across its 8 UX dimensions and rates each
finding Critical/Major/Minor/Enhancement; present its findings verbatim. Constrain it to
its audit phases (Understand + Audit) — never enter the redesign/spec phases here.

**Step B — If no UI surface exists in the diff** (backend-only, config-only, or
docs-only): do not silently skip. Actively check whether a UI *should* have been
delivered — a backend-only change is not automatically complete just because it compiled.

Check both sources:

1. **Ticket / issue** (same source as Step 3): does the description or Acceptance
   Criteria imply a user-facing flow, screen, or interaction?
2. **Code itself**: does the new or changed logic serve a use case that requires user
   interaction to be useful? Signals: exposes a new API endpoint a client is expected to
   call, creates or mutates user-visible data, implements a user-initiated workflow, or
   adds a server-side feature that is inaccessible without a corresponding UI entry point.

Based on what you find, emit **one** of these outcomes explicitly — never silently omit
this step:

- **UI expected but missing** — the ticket or code clearly implies a user-facing surface
  that was not delivered. Flag this as a gap: name the expected UI and mark it
  unaddressed.
- **UI status unclear** — the ticket or code is ambiguous about whether a UI is needed.
  Flag the uncertainty: state what was checked and what remains unresolved so the
  reviewer can confirm intent.
- **No UI needed** — the change is clearly internal (background job, migration,
  infrastructure, internal library, CLI tool with no user-facing surface). State the
  specific reason this was determined, not just the label.
