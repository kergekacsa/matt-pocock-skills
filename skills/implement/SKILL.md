---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /full-review to review the work. Fix anything flagged as a blocker or
should-fix in any dimension's own rubric — Critical or Warning from the brooks-*
dimensions, Critical or Major from the devil's-advocate step, or anything else the
report calls out as a problem — except findings that need a human decision (a design
trade-off, an ambiguous requirement, a breaking change): flag those instead. Prefer each
dimension's own fix mechanism (`/brooks-sweep` for the brooks-* findings, another skill's
own `--fix` mode where one exists) over ad hoc edits; fall back to ad hoc edits only
where no such mechanism exists.

Re-run /full-review after each fix pass, capped at 3 rounds. Stop early once a pass
reports nothing left but flagged human-decision items. If the cap is hit first, stop and
report every unresolved finding. Either way, end with a summary listing every flagged
human-decision item and any findings left unresolved by the cap.
