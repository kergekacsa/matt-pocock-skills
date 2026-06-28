# Agent routing

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
