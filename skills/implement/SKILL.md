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
Critical/Major from the devil's-advocate step. Fix every item on every checklist —
except findings that need a human decision (a design trade-off, an ambiguous
requirement, a breaking change): flag those instead. Prefer each dimension's own fix
mechanism (`/brooks-sweep` for the brooks-* findings, another skill's own `--fix` mode
where one exists) over ad hoc edits; fall back to ad hoc edits only where no such
mechanism exists. A fix pass is done only when every checklist is clear — not just the
ones with a severity tag.

Re-run /full-review after each fix pass, capped at 3 rounds. Stop early once a pass
reports nothing left but flagged human-decision items. If the cap is hit first, stop and
report every unresolved finding. Either way, end with a summary listing every flagged
human-decision item and any findings left unresolved by the cap.

Do not commit. Remind the user to run /full-review before committing. If the user wants
to commit without running /full-review first, ask for explicit confirmation — except for
a typo fix or equally trivial change, where /full-review is not needed.
