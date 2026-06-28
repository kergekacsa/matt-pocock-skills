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
- **[triage](./skills/triage/SKILL.md)** — Move issues through a state machine of triage roles.
- **[improve-codebase-architecture](./skills/improve-codebase-architecture/SKILL.md)** — Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[setup-matt-pocock-skills](./skills/setup-matt-pocock-skills/SKILL.md)** — Configure a repo for the engineering skills (issue tracker, triage labels, domain doc layout). Run once per repo.
- **[to-issues](./skills/to-issues/SKILL.md)** — Break any plan, spec, or PRD into independently-grabbable issues using vertical slices.
- **[to-prd](./skills/to-prd/SKILL.md)** — Turn the current conversation into a PRD and publish it to the issue tracker.
- **[prototype](./skills/prototype/SKILL.md)** — Build a throwaway prototype to flesh out a design.
- **[diagnosing-bugs](./skills/diagnosing-bugs/SKILL.md)** — Disciplined diagnosis loop: reproduce → minimise → hypothesise → instrument → fix → regression-test.
- **[tdd](./skills/tdd/SKILL.md)** — Test-driven development with a red-green-refactor loop.
- **[domain-modeling](./skills/domain-modeling/SKILL.md)** — Build and sharpen a project's domain model; update `CONTEXT.md` and ADRs inline.
- **[codebase-design](./skills/codebase-design/SKILL.md)** — Shared vocabulary for designing deep modules.
- **[resolving-merge-conflicts](./skills/resolving-merge-conflicts/SKILL.md)** — Resolve in-progress git merge/rebase conflicts.

**Productivity**

- **[grill-me](./skills/grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[handoff](./skills/handoff/SKILL.md)** — Compact the current conversation into a handoff document so another agent can continue the work.
- **[teach](./skills/teach/SKILL.md)** — Teach a new skill or concept over multiple sessions.
- **[writing-great-skills](./skills/writing-great-skills/SKILL.md)** — Reference for writing and editing skills well.
- **[grilling](./skills/grilling/SKILL.md)** — Reusable interview loop behind `grill-me` and `grill-with-docs`.

**Custom**

- **[aaa](./skills/aaa/SKILL.md)** — Evaluate and improve ideas, features, architecture, and code against world-class standards.
- **[devils-advocate](./skills/devils-advocate/SKILL.md)** — Adversarial review of any plan, design, architecture, or code change.
- **[documentation-standard](./skills/documentation-standard/SKILL.md)** — Standards and workflows for creating and maintaining project documentation.
- **[wrap-up](./skills/wrap-up/SKILL.md)** — Close out a work session: summarise, verify, audit commit hygiene.
- **[claude-md-optimizer](./skills/claude-md-optimizer/SKILL.md)** — Slim oversized agent-instruction files (CLAUDE.md / AGENTS.md / copilot-instructions.md) via progressive disclosure, with zero information loss.

**Codebase health (Brooks-Lint)**

Book-grounded code-review skills that diagnose decay against twelve classic engineering books. They share a single framework in [`skills/_shared/`](./skills/_shared/) (decay-risk definitions, source coverage, remedy guide), so each skill stays thin.

- **[brooks-review](./skills/brooks-review/SKILL.md)** — PR/diff review: Symptom → Source → Consequence → Remedy. Invoked by `wrap-up` and available to `aaa`.
- **[brooks-audit](./skills/brooks-audit/SKILL.md)** — Map module dependencies and architecture; also onboarding tours. Feeds `improve-codebase-architecture`.
- **[brooks-debt](./skills/brooks-debt/SKILL.md)** — Classify and prioritise tech debt into a refactoring roadmap.
- **[brooks-test](./skills/brooks-test/SKILL.md)** — Diagnose test-suite quality (brittleness, mock abuse, coverage illusion). Invoked at the `tdd` refactor step.
- **[brooks-health](./skills/brooks-health/SKILL.md)** — Composite 0–100 dashboard across all dimensions.
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

- **[mattpocock/skills](https://github.com/mattpocock/skills)** — Base fork: the engineering and productivity skills.
- **[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)** — Source of the 100+ specialized subagents in `agents/`.
- **[user538295/claude_goodies](https://github.com/user538295/claude_goodies)** — Source of the devils-advocate agent and skill, the `/da-review` and review commands, and several workflow skills.
- **[wrsmith108/claude-md-optimizer](https://github.com/wrsmith108/claude-md-optimizer)** — Source of the `claude-md-optimizer` skill in `skills/`.
- **[hyhmrright/brooks-lint](https://github.com/hyhmrright/brooks-lint)** (MIT) — Source of the `brooks-*` codebase-health skills, their shared framework in `skills/_shared/`, and the `/brooks-*` commands.

## Glossary

Terms used consistently across skills and per-repo configuration.

**Issue tracker**: The tool that hosts a repo's issues — GitHub Issues, GitLab Issues, a local `.scratch/` markdown convention, or Nimbalyst. Skills like `to-issues`, `to-prd`, and `triage` read from and write to it.
_Avoid_: backlog manager, backlog backend, issue host

**Issue**: A single tracked unit of work inside an issue tracker — a bug, task, PRD, or slice produced by `to-issues`.
_Avoid_: ticket (use only when quoting external systems that call them tickets)

**Triage role**: A canonical state-machine label applied to an issue during triage (e.g. `needs-triage`, `ready-for-agent`). Each role maps to a real label string in the issue tracker via `docs/agents/triage-labels.md`.
