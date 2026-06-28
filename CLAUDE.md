## Visual formatting

Follow `references/formatting.md` for all output — responses, skill reports, plans, and any other written content.

Use active voice ("The system validates input", not "Input is validated") and present tense ("The API returns JSON", not "The API will return JSON").

## Think before coding

State assumptions explicitly before implementing — if uncertain, ask. When multiple interpretations exist, present them; don't pick one silently. If a simpler approach exists, say so and push back. If something is unclear, stop, name what's confusing, and ask.

## Simplicity first

Minimum code that solves the problem. No features beyond what was asked, no abstractions for single-use code, no error handling for impossible scenarios. Follow YAGNI — prefer one-liner solutions where they're clear. Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Documentation stays current

Every code or behaviour change requires a documentation update in the same session. Before closing any task, identify all docs that describe the changed behaviour — README, CLAUDE.md, inline comments, API docs, HTML pages — and update every affected file. If you added a new command, skill, or script, add it everywhere similar items are listed. Outdated documentation is a bug.

## Surgical changes

Touch only what the request requires. Don't improve adjacent code, comments, or formatting. Match existing style even if you'd do it differently. If you notice unrelated dead code, mention it — don't delete it. Remove only the imports/variables/functions that your own changes made unused.

## Goal-driven execution

Transform tasks into verifiable goals before starting. For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Read-only means read-only

When asked to check, look, explore, search, see, verify, validate, or any other read-only verb — report findings only. Never modify, implement, or fix anything without explicit confirmation first.

## Communication

Understand the real intention behind the request before acting. Be direct, clear, and concise. Avoid repetition. Never soften findings — state problems and severity directly. Don't qualify with "probably," "might be worth," or "it could be argued" unless genuine uncertainty exists.

## Verification

Fact-check everything with tools. Never state a file path, function name, configuration value, line number, or behaviour as true without verifying it with Read/Grep/Glob/Bash. Confidence is not verification.

Before every factual claim:
1. **Stop** — don't respond with unverified claims
2. **Search** — locate the actual information with tools
3. **Verify** — confirm in the source
4. **Cite** — reference the exact file and location

## Commits require explicit approval

Never commit without explicit approval. Before any `git commit`, present the proposed commit message and the list of staged files using an interactive confirmation prompt — not plain chat text. Act only after the user approves that exact commit.

## Coding standards

- SOLID principles and Clean Code — no code smells
- Resolve all compiler warnings before closing a task
- Avoid magic numbers — use descriptive named constants
- Fix failing tests before moving on to the next task
- Prefer multi-agent approaches when task complexity warrants it

## Agent routing

Delegate to a specialist subagent (via the Agent tool) for **non-trivial work in a language or domain below** — multi-file features, design, debugging, reviews, or anything needing deep stack expertise. Handle trivial work inline (single-file tweaks, typos, one-liners, quick reads); don't pay subagent latency for them. When several specialists fit, pick the most specific (e.g. `nextjs-developer` over `frontend-developer` for a Next.js app).

**Languages**

| Language | Agent |
|---|---|
| TypeScript | `typescript-pro` |
| JavaScript | `javascript-pro` |
| Python | `python-pro` |
| Go | `golang-pro` |
| PHP | `php-pro` |
| C# / .NET Core | `csharp-developer`, `dotnet-core-expert` |
| Legacy .NET Framework 4.8 | `dotnet-framework-4.8-expert` |
| SQL | `sql-pro` |
| Node.js runtime | `node-specialist` |
| PowerShell (Windows/AD) | `powershell-5.1-expert` |
| PowerShell (cross-platform/cloud) | `powershell-7-expert` |

**Frameworks and clients**

| Area | Agent |
|---|---|
| React | `react-specialist` |
| Next.js | `nextjs-developer` |
| Angular | `angular-architect` |
| Multi-framework frontend | `frontend-developer` |
| Laravel | `laravel-specialist` |
| Symfony | `symfony-specialist` |
| Flutter | `flutter-expert` |
| Expo / React Native | `expo-react-native-expert` |
| Cross-platform mobile | `mobile-developer` |
| GraphQL | `graphql-architect` |
| Realtime / WebSocket | `websocket-engineer` |

**Backend and architecture**

| Area | Agent |
|---|---|
| Server-side APIs / services | `backend-developer` |
| Full-stack feature (DB→UI) | `fullstack-developer` |
| API design / specs | `api-designer` |
| Microservices decomposition | `microservices-architect` |
| System design review | `architect-reviewer` |

**DevOps and infrastructure**

| Area | Agent |
|---|---|
| CI/CD pipelines | `deployment-engineer` |
| Infra automation / containers | `devops-engineer` |
| Docker images | `docker-expert` |
| Terraform / IaC | `terraform-engineer` |
| Cloud architecture | `cloud-architect` |
| Azure infrastructure | `azure-infra-engineer` |
| Networking | `network-engineer` |
| Internal developer platform | `platform-engineer` |
| Reliability / SLOs | `sre-engineer` |
| Active production incident | `devops-incident-responder` |

**Data**

| Area | Agent |
|---|---|
| PostgreSQL | `postgres-pro` |
| Query / perf (any engine) | `database-optimizer` |
| DB admin / HA / backups | `database-administrator` |

**Security**

| Area | Agent |
|---|---|
| Penetration testing | `penetration-tester` |
| Security audit / compliance | `security-auditor` |
| Security implementation | `security-engineer` |
| Payments / PCI | `payment-integration` |

**Quality, debugging, maintenance**

| Area | Agent |
|---|---|
| Diagnose / fix bugs | `debugger` |
| Cross-service error correlation | `error-detective` |
| Test automation | `test-automator` |
| QA strategy | `qa-expert` |
| Code review | `code-reviewer` |
| Refactoring | `refactoring-specialist` |
| Legacy modernization | `legacy-modernizer` |
| Performance tuning | `performance-engineer` |
| Build performance | `build-engineer` |
| Dependency management | `dependency-manager` |

**Tooling and docs**

| Area | Agent |
|---|---|
| CLI tools | `cli-developer` |
| Developer tooling | `tooling-engineer` |
| MCP servers | `mcp-developer` |
| Technical docs | `technical-writer` |
| API docs | `api-documenter` |
| README | `readme-generator` |

**Fallbacks**

- No specialist matches → `general-purpose`.
- Read-only fan-out search across many files → `Explore`.
- Implementation planning → `Plan`.
- Non-engineering work (product, marketing, analytics, research, UX) → browse `agents/` for the matching role.
