# ~/.claude template

A ready-to-use `~/.claude/` starter for Claude Code. Clone this repo into `~/.claude/` to get a fully configured agent environment — skills, agents, commands, and shared references pre-wired.

Forked from [mattpocock/skills](https://github.com/mattpocock/skills) and extended with additional skills and shared formatting references.

## Quickstart

```bash
git clone https://github.com/kergekacsa/matt-pocock-skills ~/.claude
```

Then run `/setup-matt-pocock-skills` in your agent to configure per-repo settings (issue tracker, triage labels, domain doc layout).

## What's included

### `skills/`

All skills live flat in `skills/` — Claude Code resolves them at `~/.claude/skills/<name>/`.

**Engineering**

- **[ask-matt](./skills/ask-matt/SKILL.md)** — Router: ask which skill or flow fits your situation.
- **[grill-with-docs](./skills/grill-with-docs/SKILL.md)** — Grilling session that builds your project's domain model, sharpening terminology and updating `CONTEXT.md` and ADRs inline.
- **[triage](./skills/triage/SKILL.md)** — Move tickets through a state machine of triage roles.
- **[improve-codebase-architecture](./skills/improve-codebase-architecture/SKILL.md)** — Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[setup-matt-pocock-skills](./skills/setup-matt-pocock-skills/SKILL.md)** — Configure a repo for the engineering skills (issue tracker, triage labels, domain doc layout). Run once per repo.
- **[to-tickets](./skills/to-tickets/SKILL.md)** — Break a plan, spec, or conversation into tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker.
- **[to-spec](./skills/to-spec/SKILL.md)** — Turn the current conversation into a spec (PRD) and publish it to the issue tracker — no interview, just synthesis of what you've already discussed.
- **[prototype](./skills/prototype/SKILL.md)** — Build a throwaway prototype to flesh out a design.
- **[ux-expert](./skills/ux-expert/SKILL.md)** — UX design expert for auditing and redesigning pages, dashboards, and data-heavy interfaces across 8 UX dimensions. Feeds `to-spec`'s UI/UX section, and `full-review` delegates its UI/UX audit to it.
- **[diagnosing-bugs](./skills/diagnosing-bugs/SKILL.md)** — Disciplined diagnosis loop: reproduce → minimise → hypothesise → instrument → fix → regression-test.
- **[tdd](./skills/tdd/SKILL.md)** — Test-driven development with a red-green-refactor loop.
- **[domain-modeling](./skills/domain-modeling/SKILL.md)** — Build and sharpen a project's domain model; update `CONTEXT.md` and ADRs inline.
- **[codebase-design](./skills/codebase-design/SKILL.md)** — Shared vocabulary for designing deep modules.
- **[resolving-merge-conflicts](./skills/resolving-merge-conflicts/SKILL.md)** — Resolve in-progress git merge/rebase conflicts.
- **[worktree](./skills/worktree/SKILL.md)** — Create a git worktree from the current branch and confine the rest of the session to it. Pairs with `wrap-up`'s worktree-cleanup step for the merge/teardown at the end.

**Productivity**

- **[grill-me](./skills/grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[handoff](./skills/handoff/SKILL.md)** — Compact the current conversation into a handoff document so another agent can continue the work.
- **[teach](./skills/teach/SKILL.md)** — Teach a new skill or concept over multiple sessions.
- **[writing-great-skills](./skills/writing-great-skills/SKILL.md)** — Reference for writing and editing skills well.
- **[grilling](./skills/grilling/SKILL.md)** — Reusable interview loop behind `grill-me` and `grill-with-docs`.
- **[research](./skills/research/SKILL.md)** — Delegate reading legwork to a background agent that investigates a question against primary sources and writes the findings to a Markdown file.

**Custom**

- **[aaa](./skills/aaa/SKILL.md)** — Evaluate and improve ideas, features, architecture, and code against world-class standards.
- **[devils-advocate](./skills/devils-advocate/SKILL.md)** — Adversarial review of any plan, design, architecture, or code change.
- **[full-review](./skills/full-review/SKILL.md)** — The heavyweight, full-depth review: any code scope — a PR, commit range, uncommitted diff, directory, or module — checked for correctness (runs the real test suite), spec/design-doc compliance, documentation drift, code quality, test quality, architecture, and UI/UX (delegated to `ux-expert`'s audit when the change touches a rendered surface), plus a mandatory adversarial challenge. Read-only; delegates every check to the skill that owns it, run at full depth (not `brooks-health`'s capped/abbreviated scan). Never mutates. It's a **router**, not a replacement: this removes the duplicated review *logic* that used to live inside `wrap-up`, but `brooks-health`, `brooks-*`, and `code-review-matt` all stay independently invocable for a narrower, single-dimension check — reach for `full-review` when you want every dimension gated at once, and one of the others when you only want its angle.
- **[documentation-standard](./skills/documentation-standard/SKILL.md)** — Standards and workflows for creating and maintaining project documentation.
- **[database-schema-documenter](./skills/database-schema-documenter/SKILL.md)** — Author and maintain a repo's single ground-truth database schema doc: table schemas, ERDs, conventions, kept in sync after migrations.
- **[wrap-up](./skills/wrap-up/SKILL.md)** — Close out a work session: runs only the test suite itself, then reports whether `full-review`/`code-review-matt`/docs/acceptance criteria ran or are still missing — never running any of them. Everything missing blocks the commit offer by default, overridable per-item, this session only. Also sweeps the conversation for open questions, deferred decisions, and ideas raised in passing, filing anything worth tracking directly with a `needs-triage` tag and full context rather than running the heavier `/to-tickets` process. Summarises, proposes a commit, merges and tears down a git worktree if the session used one, then closes the ticket.
- **[claude-md-optimizer](./skills/claude-md-optimizer/SKILL.md)** — Slim oversized agent-instruction files (CLAUDE.md / AGENTS.md / copilot-instructions.md) via progressive disclosure, with zero information loss.
- **[md-reviewer](./skills/md-reviewer/SKILL.md)** — Semantic/logic consistency reviewer for Markdown docs — contradictions, cross-references, master-follower validation, resumable for 50+ file sets.

**Codebase health (Brooks-Lint)**

Book-grounded code-review skills that diagnose decay against twelve classic engineering books. They share a single framework in [`skills/_shared/`](./skills/_shared/) (decay-risk definitions, source coverage, remedy guide), so each skill stays thin.

- **[brooks-review](./skills/brooks-review/SKILL.md)** — PR/diff review: Symptom → Source → Consequence → Remedy. Invoked by `full-review` and available to `aaa`.
- **[brooks-audit](./skills/brooks-audit/SKILL.md)** — Map module dependencies and architecture; also onboarding tours. Feeds `improve-codebase-architecture`.
- **[brooks-debt](./skills/brooks-debt/SKILL.md)** — Classify and prioritise tech debt into a refactoring roadmap. Also `full-review`'s code-quality delegate for whole-directory/module (no-diff) targets.
- **[brooks-test](./skills/brooks-test/SKILL.md)** — Diagnose test-suite quality (brittleness, mock abuse, coverage illusion). Invoked at the `tdd` refactor step.
- **[brooks-health](./skills/brooks-health/SKILL.md)** — Lightweight composite 0–100 dashboard across all four Brooks dimensions, using abbreviated/capped scans for a fast score — no test execution, no doc-drift check, no adversarial challenge. Use `full-review` instead when the full-depth pass is wanted, not just a number.
- **[brooks-sweep](./skills/brooks-sweep/SKILL.md)** — Run every check and auto-apply the safe fixes.

### `agents/`

100+ specialized subagents covering engineering, infrastructure, data, security, and product roles. The bulk are imported from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — browse `agents/` for the full list.

- **[devils-advocate](./agents/devils-advocate.md)** — Subagent for deep adversarial review with live verification tools.

### `commands/`

- **[da-review](./commands/da-review.md)** — `/da-review` entry point for the devils-advocate skill.
- **brooks-{[review](./commands/brooks-review.md), [audit](./commands/brooks-audit.md), [debt](./commands/brooks-debt.md), [test](./commands/brooks-test.md), [health](./commands/brooks-health.md), [sweep](./commands/brooks-sweep.md)}** — `/brooks-*` entry points for the Brooks-Lint codebase-health skills.

### `references/`

Shared reference files loaded by skills and referenced in `CLAUDE.md`:

- **[formatting.md](./references/formatting.md)** — Visual formatting, Mermaid guidelines, and Markdown style rules for all output.
- **[agent-routing.md](./references/agent-routing.md)** — Full language/framework/domain → specialist subagent mapping, linked from the Agent routing section of `CLAUDE.md`.

## Sources

This template draws on several upstream projects:

- **[mattpocock/skills](https://github.com/mattpocock/skills)** — Base fork: the engineering and productivity skills. (updated 2026-07-10)
- **[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)** — Source of the 100+ specialized subagents in `agents/`. (updated 2026-06-23)
- **[user538295/claude_goodies](https://github.com/user538295/claude_goodies)** — Source of the devils-advocate agent and skill, the `/da-review` and review commands, and several workflow skills. (updated 2026-07-09)
- **[wrsmith108/claude-md-optimizer](https://github.com/wrsmith108/claude-md-optimizer)** — Source of the `claude-md-optimizer` skill in `skills/`. (updated 2026-06-23)
- **[hyhmrright/brooks-lint](https://github.com/hyhmrright/brooks-lint)** (MIT) — Source of the `brooks-*` codebase-health skills, their shared framework in `skills/_shared/`, and the `/brooks-*` commands. (updated 2026-07-09)

## Glossary

Terms used consistently across skills and per-repo configuration.

**Issue tracker**: The tool that hosts a repo's tickets — GitHub Issues, GitLab Issues, a local `.scratch/` markdown convention, or Nimbalyst. Skills like `to-tickets`, `to-spec`, and `triage` read from and write to it.
_Avoid_: backlog manager, backlog backend, issue host

**Ticket**: A single tracked unit of work inside an issue tracker — a bug, task, PRD, or slice produced by `to-tickets`.
_Avoid_: issue as the unit of work (reserve "issue" for the tracker's name — "issue tracker", "GitHub Issues")

**Triage role**: A canonical state-machine label applied to a ticket during triage (e.g. `needs-triage`, `ready-for-agent`). Each role maps to a real label string in the issue tracker via `docs/agents/triage-labels.md`.
