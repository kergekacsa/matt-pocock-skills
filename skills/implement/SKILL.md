---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /full-review to review the work, and treat every checklist the report
emits as equally binding — the Acceptance Criteria coverage table (Step 3) is its own
checklist, not a subset of "anything else the report calls out as a problem": hold each
AC item to the same bar as a Critical/Warning from the brooks-* dimensions or a
Critical/Major from the devil's-advocate step. Fix every item on every checklist rated
Moderate or higher in the report's Severity column — except findings that need a human
decision (a design trade-off, an ambiguous requirement, a breaking change): flag those
instead. Do not touch Minor findings: do not fix them, do not flag them, and do not
count them as unresolved. Prefer each dimension's own fix mechanism (`/brooks-sweep`
for the brooks-* findings, another skill's own `--fix` mode where one exists) over ad
hoc edits; fall back to ad hoc edits only where no such mechanism exists. A fix
mechanism MUST skip Minor findings. When you invoke `/brooks-sweep`, tell it to add a
fifth item to the list its guide gives every subagent (scope, risk definitions, config
values, `unresolvable` set): "Treat Suggestion findings as not found. Do not fix,
record, or count them." The sweep MUST pass this item to every subagent, including
the re-scan rounds. A fix pass is done only when every Moderate-or-higher item on every
checklist is clear — not just the ones with a severity tag.

Finishing a step, or a delegated sub-skill returning, does not end the turn. Start the
next step with a tool call in the same message. End the turn only for a question to the
user, the final report, or when only a background task remains.

Re-run /full-review after each fix pass, capped at 3 rounds. Stop early once a pass
reports nothing left but flagged human-decision items and Minor findings. If the cap is
hit first, stop and report every unresolved finding. Either way, end with a summary listing every flagged
human-decision item and any findings left unresolved by the cap.

Do not commit and do not close any ticket. Remind the user to run /wrap-up first.
If the user wants to commit or close a ticket without running /wrap-up, ask for
explicit confirmation — except for a typo fix or equally trivial change.
