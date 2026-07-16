---
name: wrap-up
description: "Close out a work session: run the test suite — the only thing this skill runs itself — then report on everything else (full-review/code-review, documentation, acceptance criteria) as done, unfinished, or missing, without running any of it, plus a separate non-blocking tracker-status check at ticket close. Failing or incomplete tests, or any reported-missing review/docs/AC item, block the commit offer by default; the user can explicitly override a specific blocker to proceed anyway, this session only. Never changes anything without an explicit yes. Use when the user says 'wrap up', 'are we done', 'what's left', 'did we commit everything', or 'close out'."
---

# Wrap-Up

You are the person who, at the end of a work session, stops and asks "okay — what did we actually do, why did we do it, and what's actually finished?" You run the one check that's genuinely this skill's job, report honestly on everything else, and hand control back to the user.

## What this skill does NOT do

This skill runs **only the test suite** itself. It never runs `/full-review`, `/code-review-matt`, `/da-review`, `/brooks-review`, or any other check on the user's behalf — those are the user's to invoke, on their own schedule. If one of them hasn't run this session, or ran but left findings unresolved, wrap-up reports that plainly as missing or unfinished. It does not chase it down, does not offer to run it for the user, and does not fix anything itself.

## Prime directive — verify freely, never mutate without a yes

Verify freely: run the test suite, inspect git/tracker/session state, read what other checks already reported in this session's history (never re-run any of them), ask the user about a blocker — none of that is a mutation. Never mutate — edit or fix code, stage, commit, or touch the tracker (including closing the ticket) — without an explicit yes to that specific action. If you are unsure which class something is in, treat it as mutating — ask first.

## Step 1 — Gather the facts (read-only)

Collect, without changing anything:

- **What changed this session.** The files this session edited (session-edited-files tooling if available, else `git status` + `git diff`), and which commits were made *during* this session vs. which changes are still uncommitted.
- **What was pre-existing.** Compare against the working-tree state at session start. Files that were already modified/untracked before this session are **not** this session's work — call them out separately so they never get conflated with the session's diff.
- **The intent / the "why".** Which issue, ticket (e.g. NIM-XX), bug report, or request drove this session. Pull the tracker item and its acceptance criteria if there is one. If there is no ticket, derive intent from the first user prompt(s).

## Step 2 — Run the tests

The only check this skill performs itself. Identify the project's canonical way to run **all** of its tests — a root test script, CI config, or, for a monorepo, every workspace's suite, not just the one nearest this session's change — and run it. Record pass/fail. If only a subset actually ran (e.g. one workspace because the others couldn't be discovered or invoked), mark this ⚠️ unfinished, not ✅ — a partial run is not a pass, and the unrun portion is its own blocker in Step 5. Don't proceed past a failing or incomplete suite without flagging it as a blocker. If the project has no test suite and nothing invocable (e.g. a documentation-only repo), say so explicitly and mark this step not applicable — never fabricate a result for a suite that doesn't exist.

## Step 3 — Check what else has (and hasn't) happened

Read-only — for each item below, look at this session's conversation and tool-call history for evidence. **Do not run any of them yourself**, even if one is missing or looks quick to run.

- **Full review / code review.** Did `/full-review` (or a narrower single-dimension skill run on its own — `/code-review-matt`, `/brooks-review`, `/da-review`) run this session, covering this session's current diff? If yes, note what it found and whether any finding is still unresolved. If no run covers the current diff, mark it **missing** — this session's changes have not been reviewed.
- **Documentation.** Is there evidence in this session that docs describing changed behavior were checked or updated? If there's no such evidence, mark **not checked** — don't assume it's fine because the change looked small.
- **Acceptance criteria.** If a review report from this session already states AC status per individual criterion, use it verbatim — don't re-derive it. "Met" means every individual criterion is confirmed satisfied by that report; a report that only gives a blanket "AC met" without addressing each criterion individually doesn't qualify — mark it **not checked** instead. Otherwise mark **not checked**. (In practice this only comes up when the user has already chosen to override the missing-review blocker below, since that's the same report this would otherwise come from.)

Mark each item ✅ done / ⚠️ unfinished (it ran, but something's still open) / ❌ missing (never ran) / ❓ can't tell — based on evidence, never optimism.

Tracker staleness (beyond acceptance criteria) is not a commit blocker — it's checked separately in Step 8, since it bears on closing the ticket, not on whether the code itself is safe to commit.

## Step 4 — Write the summary

Present a short, factual summary in two parts:

- **What was done** — the concrete changes, grouped logically (not a raw file list). Reference files as clickable links and commits by hash.
- **What it was for** — the issue/intent it served, and whether the change actually satisfies that intent.
- **Where it went sideways** — wrong turns, disproven assumptions, or corrections the user had to make this session. State them plainly; a misconception that survived into a commit or a doc is a defect.

Keep it tight. The user was there; this is a confirmation, not a retelling.

## Step 5 — Report

Show the summary (Step 4) together with the Step 2 (tests) and Step 3 (everything else) status. Be honest — if something can't be verified, mark it ❓ rather than assuming ✅.

**Everything blocks by default.** A failing or incomplete test suite, or any Step 3 item marked ⚠️/❌/❓, is a blocker on the commit offer (Step 7) — full stop, no exceptions baked in. List every current blocker plainly in the report.

## Step 6 — Override or proceed

If there are no blockers, go straight to **Step 7 (Commit)**.

If there are blockers, walk them one at a time via an interactive prompt — never assume a blanket "proceed anyway":

> These are blocking the commit right now:
> 1. Tests failing — [summary]
> 2. Full-review hasn't run for this diff
> 3. …
> For each: fix it now, or override it (I'll state what proceeding without it means first)?

- **Fix it now** — what this means depends on where the blocker came from. A **Step 2 (tests)** blocker is wrap-up's own to hand off: a failing test routes to the right flow (`/tdd`, a direct fix); a partial run (some suite couldn't be discovered or invoked) routes to making that suite invocable — either way, **re-run Step 2** afterward regardless of how small the fix looks, since a fix to one thing can silently break another. A **Step 3** blocker (missing review, undocumented change) is never wrap-up's to fix or run, full stop: say so, then pause here — the user leaves wrap-up, does the thing themselves (runs `/full-review`, updates the doc), and re-invokes wrap-up to re-check. Wrap-up performs or orchestrates neither kind of fix itself. Any new blocker either path surfaces re-enters this same walk.
- **Override** — state the concrete consequence of proceeding without it (a failing test staying broken, a suite of unknown status going uncommitted-against, an unreviewed diff going in uninspected, an unchecked AC) and get the user's explicit yes to that specific override before it stops blocking. An override applies to this wrap-up only, not as a standing exception for next time — but it does survive this run's own Step 2 re-runs: a re-run triggered by a different fix doesn't re-litigate an override already granted earlier in this same run. Only genuinely new blockers re-enter this walk.

Nothing proceeds to Step 7 until every blocker is either fixed or explicitly overridden.

## Step 7 — Commit

Reachable once there are no blockers left, whether because everything was clean or every blocker was explicitly overridden in Step 6.

**Commit hygiene.** The staged set must contain **only this session's changes** — explicitly name and exclude any files that were already dirty at session start.

If anything was overridden rather than fixed, name it plainly in the interactive prompt so the override is visible at the moment of commit, not buried earlier in the transcript.

Propose the commit via an interactive prompt. Act only after an explicit yes.

## Step 8 — Close the ticket

Reachable only **after** the commit lands in Step 7, and only if Step 3's acceptance-criteria status is **known and met** — "met" meaning every individual criterion is confirmed satisfied (see Step 3), read from an existing report, not derived here. If AC status is `not checked` or reports anything unmet, don't offer this — say plainly what's unresolved instead. If there's no ticket at all, this step doesn't apply — skip it, there's nothing to close.

Before proposing the flip, check whether anything else about the ticket is stale (labels, links, a status that should already reflect this work) — this is wrap-up's own read-only check, not read from any report — and name it alongside the proposal so it isn't closed over silently.

If the ticket has acceptance-criteria checkboxes, match each one to the specific criterion Step 3's report confirmed as met, and list the literal checkbox text in the proposal so the user can catch any mismatch before confirming. Tick only the checkboxes with an unambiguous match; leave any checkbox the report didn't explicitly address unticked and call it out in the same proposal — it means the ticket's checklist doesn't fully line up with what was reviewed. This is a mutation like any other: propose it as its own interactive prompt, separate from the status flip below, so the user can approve one without the other. Act only after an explicit yes. Never tick a box the report didn't confirm as met. If ticking spans multiple boxes and only some succeed, report exactly which ones landed and which didn't — never present a partial tick-off as fully done.

Propose flipping the ticket's status (e.g. to done/closed) via its own interactive prompt. Act only after an explicit yes.

## Notes

- "Are we done?" is the question this skill answers. The honest answers are "yes, here's the proof" or "no, here's exactly what's left" — never a hopeful "should be."
