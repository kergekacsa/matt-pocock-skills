---
name: wrap-up
description: "Close out a work session: summarize what was done, run tests and devil's advocate, audit docs and tracker, then propose a commit via a traffic-light gate (🟢 all clean → propose immediately; 🟡 optional items remain → ask first; 🔴 blockers → fix first). Never changes anything without an explicit yes. Use when the user says 'wrap up', 'are we done', 'what's left', 'did we commit everything', or 'close out'."
---

# Wrap-Up

You are the person who, at the end of a work session, stops and asks "okay — what did we actually do, why did we do it, and did we finish it properly?" You produce a clear summary and an honest checklist, then hand control back to the user.

## Prime directive — verify freely, never mutate without a yes

Every action in this skill falls into one of two classes. The line between them is the whole point of the skill.

**Non-mutating — run these yourself, automatically, no asking.** Anything that only *observes* and leaves the code, git history, and tracker untouched:
- inspecting git/tracker/session state,
- **running the test suite**,
- **running `/da-review`** on this session's work,
- **running `/brooks-review`** (and `/brooks-test` when tests changed) on this session's work.

These are part of the audit. Run them as a matter of course — don't ask permission to verify. (Tests exercising a test DB/fixtures is fine; that is the harness doing its job, not a change to the user's code, commits, or tracker.)

**Mutating — never without an explicit yes to that specific action.** Anything that writes to disk, git, or the tracker:
- editing or fixing code,
- staging/committing,
- updating the tracker,
- any other write.

For a mutating step you **report and ask**, and act only after the user says yes to that exact step — then hand off to the proper skill/tool rather than improvising. "Wrap up" is never an instruction to fix or commit things on its own.

If you are unsure which class something is in, treat it as mutating — ask first.

## Step 1 — Gather the facts (read-only)

Collect, without changing anything:

- **What changed this session.** The files this session edited (session-edited-files tooling if available, else `git status` + `git diff`), and which commits were made *during* this session vs. which changes are still uncommitted.
- **What was pre-existing.** Compare against the working-tree state at session start. Files that were already modified/untracked before this session are **not** this session's work — call them out separately so they never get conflated with the session's diff.
- **The intent / the "why".** Which issue, ticket (e.g. NIM-XX), bug report, or request drove this session. Pull the tracker item and its acceptance criteria if there is one. If there is no ticket, derive intent from the first user prompt(s).
- **Where verification stands.** Note whether tests and a devil's-advocate pass were already run this session — but don't rely on it. You will run both yourself in Step 3 regardless, since they're non-mutating.

## Step 2 — Write the summary

Present a short, factual summary in two parts:

- **What was done** — the concrete changes, grouped logically (not a raw file list). Reference files as clickable links and commits by hash.
- **What it was for** — the issue/intent it served, and whether the change actually satisfies that intent.
- **Where it went sideways** — wrong turns, disproven assumptions, or corrections the user had to make this session. State them plainly; a misconception that survived into a commit or a doc is a defect. If one traces back to a missing or misleading doc, carry it into the Documentation check as a fix to propose.

Keep it tight. The user was there; this is a confirmation, not a retelling.

## Step 3 — Run verification, then audit the rest

This step has two halves. **Run** the non-mutating verification yourself (items 1–3); **assess** the rest read-only (items 4–6). Mark each ✅ done / ⚠️ partial / ❌ not done / ❓ can't tell, based on evidence, not optimism.

Run these now — no asking, **unless** they already ran successfully after the last meaningful change this session. If skipping, say so explicitly and state why (e.g. "Tests passed at 14:32 after the last code change — not re-running").

1. **Tests** — Run the relevant test suite and record the result. If running is genuinely blocked (e.g. Docker/DB not up), say so and mark ❓ — don't fabricate a pass.
2. **Devil's advocate** — Run the `/da-review` skill (not the `devils-advocate` agent — the skill keeps the output visible and in context). Provide it with the issue/task and acceptance criteria gathered in Step 1 **and** all session changes, so it can assess correctness against intent, not just internal code quality. Capture its findings.
3. **Brooks decay scan (advisory)** — Run `/brooks-review` on this session's work (and `/brooks-test` when tests or test files changed) and capture its findings. Treat these as **advisory** — report them in Step 4, but unlike tests and the devil's advocate they do **not** block wrap-up unless they surface a genuine defect.

Assess these read-only:

4. **Documentation** — Do all docs that describe changed behaviour reflect the new reality? Check README, CLAUDE.md and the files it references (e.g. `references/`), inline comments, API docs, and any HTML pages. Outdated documentation is a bug. Likewise, if a misconception you hit this session traces to a doc gap, propose the fix here.
5. **Done vs. acceptance criteria** — Walk the ticket's acceptance criteria one by one. Is each genuinely met, or just plausibly met? Flag any AC that's unaddressed or only partially covered.
6. **Tracker** — Is the issue's status current (e.g. flipped to in-review/done when its ACs are met)? A finished-but-still-to-do ticket is a gap.

Adapt the **assessment** items (4–6) to the session: a planning/triage session may have no ticket; a pure-refactor session may have no docs to update. Drop an assessment item only when it genuinely cannot apply, and say why.

The two blocking verifications (1 tests, 2 devil's advocate) are **never** droppable on these grounds. "It was a small change", "I'm confident it's fine", or "there's no ticket" are not reasons to skip them — run both every time. The only acceptable non-run is a hard block (e.g. test harness won't start), which is marked ❓ with the reason, never silently omitted.

## Step 4 — Report

Show the summary (Step 2) and the checklist (Step 3) together, including what the tests and devil's advocate you just ran turned up. Lead with the traffic-light headline: **🟢 green — done and clean**, **🔴 blockers found — must fix first**, or **🟡 yellow — clean but optional items remain**. Be honest — if something is ❓ because you couldn't verify it, say so rather than marking it ✅.

## Step 5 — Branch on what verification found

The question you ask depends entirely on whether verification came back clean.

### Case A — tests failed, or devil's advocate found something that needs to change

These are **blockers**, not close-out chores. The issue is not finished, so do **not** offer to commit, update the tracker, or otherwise "wrap up the issue" — that would be wrapping up around a known defect. Instead, present the failing tests / DA findings and ask the one question that fits: **do you want me to fix these now?**

> Devil's advocate / the tests surfaced these, and they need fixing before this can be wrapped up:
> 1. … 2. …
> Want me to fix them? [ ] fix all · [ ] fix #1 only · [ ] not now

Fixing is a mutating action, so it happens only after the user says yes — then hand off to the right flow (`/tdd`, `/da-review`'s fix pass, a direct fix). After fixes land, verification re-runs and the wrap-up continues. Until then, the commit/tracker steps stay off the table.

### Case B — tests green and devil's advocate clean

If any non-commit mutating close-out steps remain (e.g. tracker update, doc fix), offer them now via an interactive prompt. Act only after an explicit yes; don't nudge twice for steps the user skips.

Then proceed to **Step 6** for the commit.

## Step 6 — Commit

Assess the traffic-light status from all Step 3 results, check commit hygiene, and act.

**Commit hygiene.** The staged set must contain **only this session's changes** — explicitly name and exclude any files that were already dirty at session start.

**🟢 Green — all checks found nothing.** Every Step 3 item is ✅ (tests pass, DA clean, Brooks clean, docs current, ACs fully met, tracker current). Propose a commit immediately without asking.

**🟡 Yellow — blockers clear, but optional items remain.** Tests and DA are ✅, but one or more items are ⚠️ (e.g. Brooks advisory findings, docs improvements suggested, tracker not updated, ACs partially covered). List the yellow items and ask — via interactive prompt — whether to address them first or commit now. Either answer is valid; don't nudge twice.

**🔴 Red — Step 5 Case A applies; Step 6 never runs.**

## Notes

- "Are we done?" is the question this skill answers. The honest answers are "yes, here's the proof" or "no, here's exactly what's left" — never a hopeful "should be."
