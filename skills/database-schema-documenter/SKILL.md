---
name: database-schema-documenter
description: >
  Author and maintain a repo's single ground-truth database schema documentation —
  table schemas, ERDs, conventions, and drift after migrations.
  Triggers when: user asks to document a database schema, generate or update an ERD,
  write table/column documentation, or asks whether the schema docs still match the
  real database after a migration. Also triggers when user mentions documenting any
  part of a database's schema — tables, views, triggers, functions, indexes,
  constraints, permissions — or terms like schema doc, data dictionary, database
  documentation, table reference, FK diagram.
  Do NOT trigger for: general project documentation unrelated to a database schema
  (use documentation-standard) or a one-off pre-merge check of whether docs are
  current across an entire PR (use full-review, which should delegate the database
  axis here).
---

# Database Schema Documenter

Maintain exactly one schema doc per repo that reflects **ground truth** — the real database and the source code that defines it, not what was true last time someone wrote it down. Within the doc, an ERD is a navigational summary and the table schema is its fuller record — but neither is the source of truth. The doc only ever describes ground truth; it never replaces it.

## Locate the doc

Check, in order: an existing dedicated schema doc under an obvious name (`SCHEMA.md`, `DATABASE.md`, `docs/database/*.md`); the data-architecture slot of whatever documentation structure the repo already uses (e.g. a numbered `docs/architecture/*data*` file); a repo-wide content sweep for anything schema-shaped elsewhere (grep for `erDiagram` markers, or headings/filenames containing "schema"/"database"/"data model"). If the sweep turns up a candidate, confirm with the user before treating it as the doc — never adopt a match silently, since a false positive (a design doc that merely contains an ERD) would misfile every future update. Only once no candidate is found or confirmed, ask the user where to put a new one, defaulting to `docs/database_schema.md`. If more than one schema doc already exists, flag it — consolidate rather than adding a third.

## Establish ground truth

Detect what's actually available, in priority order, and treat the highest-priority one found as authoritative. This order runs from direct observation to weaker inference: a live DB and migrations both carry the full DDL shape (types, constraints, indexes); application source code only reveals whatever columns happen to be queried somewhere, with no type/constraint information at all, and can just as easily be stale (dead code paths, feature-flagged branches) as a migration can drift from the live schema — it's a different failure mode, not a more reliable one.

1. A live database connection (introspect directly).
2. Migration files (e.g. `prisma/migrations`, `db/migrate`, `alembic/versions`) — reconstruct the current state from the full history, not just the latest file. Migrations can drift from the live schema (manual hotfixes, edited-after-applied files, out-of-order application across environments) — this is exactly what cross-checking against a live connection, when one exists, is for.
3. ORM/model definitions (`schema.prisma`, `models.py`, TypeORM/Sequelize entities).
4. Application source code (raw SQL, query builders, hand-rolled schema references) — when nothing above exists.
5. Nothing implemented yet — a design doc, spec, or plan the user provides, when the database itself doesn't exist. Every table this produces is planned, not real; see "Mark what isn't real yet" below.
6. None found — ask the user.

This ladder governs structural facts (tables, columns, types, constraints, indexes) — it doesn't apply to behavioral facts like a table's Lifecycle or a column's mutability trigger, since no structural source can reveal *why* or *when* something happens. See [references/table-schema-format.md](references/table-schema-format.md)'s Lifecycle section for that separate rule: check application source code regardless of which structural source above is primary.

Whenever ground truth comes from migrations or ORM models with no live connection, also do a lightweight grep of application source for column/table references that don't appear anywhere in that ground truth — a real hit is a concrete migration-drift signal, and gets surfaced the same way as any other source disagreement below.

If more than one of these is available, check them against each other, not just the highest-priority one. State a **Ground truth line** before writing anything, e.g. `Ground truth: introspected live Postgres DB (14 tables), cross-checked against migrations` — or, for a plan-only doc, `Ground truth: no implementation exists yet; based on <plan/spec name>`. If sources disagree, call out the inconsistency explicitly in that line — which tables/columns differ and which source you treated as authoritative — rather than silently picking one. Every table that exists in ground truth must end up in the doc; every table already in the doc that no longer exists in ground truth must be flagged, never silently dropped or silently kept.

## Decide flat vs. chaptered

8 tables or fewer: one flat doc — a single ERD, then all table schemas. More than 8: split into chapters. Chapter boundaries must be deterministic, so two runs on the same repo produce the same chapters:

1. Prefer existing domain/bounded-context signals already in the repo (folder structure, an existing `CONTEXT.md`, module boundaries) when they exist.
2. Otherwise, first carve out hub tables — any table referenced by more than `max(3, 15% of total table count)` other tables — into their own opening chapter. (This is why user/auth is usually the opener: it's almost always the highest-fan-in table.) Then group the remaining non-hub tables by FK-connected component, using only edges between non-hub tables. A non-hub table with no non-hub edges (its only FK is to a hub) has no real component — its full schema goes in the hub chapter instead of a separate singleton chapter.
3. If this produces more than one FK-connected-component chapter, order them by descending cluster size (largest first). If cluster sizes tie, or more than one table qualifies as a hub, present the candidate groupings to the user and ask them to confirm or adjust rather than resolving automatically.

A table's schema-writing home is always its assigned chapter from steps 1-3 above, regardless of where it's first drawn. The hub chapter's ERD draws the hub table(s) plus their direct referrers for navigational value — see [references/erd-notation.md](references/erd-notation.md) for how a referrer whose real home is elsewhere is marked there, and the cap for hubs with many direct referrers — but a table appearing on the hub chapter's ERD never changes where its schema is written. A table can also appear on more than one chapter's ERD beyond hub-adjacency (see erd-notation.md's cross-chapter rules); its full schema is written once, in its assigned chapter, and other chapters point back to it instead of repeating it.

## Write the preamble

Every schema doc opens with two sections, before any chapter:

- **Scope** — database type/engine, extensions/features enabled (e.g. `pgcrypto`, `PostGIS`), links to related docs or ADRs, and what's explicitly out of scope (e.g. "sessions live in Redis; not documented here").
- **Conventions** — naming, ID strategy, timestamp columns, nullability defaults, FK conventions, soft vs. hard delete, secret handling, string length caps, and anything deliberately never stored in this database.

## Per chapter: ERD, then schemas

1. Draw the ERD first. See [references/erd-notation.md](references/erd-notation.md) for the exact Mermaid syntax, the solid/dashed FK convention, and the `+ N columns` rule for anything filtered out of the diagram. The ERD stays a summary — never let it silently gain facts the table schema doesn't also state.
2. Write full table schemas after the ERD. See [references/table-schema-format.md](references/table-schema-format.md) for the column table, index/check/unique documentation, JSONB structure, triggers/functions, migration references, and row-level security/grants.
3. For any table with no FK, state the reason at the end of the chapter.
4. After all table schemas, document any views or materialized views the chapter's tables feed — see [references/table-schema-format.md](references/table-schema-format.md).

## Mark what isn't real yet

If a table or column is referenced (by the user, a design doc, or a plan) but doesn't exist in ground truth, document it anyway if useful — but mark it unmistakably as **not yet implemented**. Never let planned and existing schema blend together without a visible marker.

If the *entire* doc is planned (ground truth is a plan, not an implementation — see "Establish ground truth"), don't repeat the full not-yet-implemented sentence on every single table; that's noise, not signal. State it once, clearly, in Scope instead (e.g. "This describes a planned schema; nothing here is implemented yet — see `<plan link>`"). Keep the compact per-entity `(planned)` alias on every table anyway, even though every one of them applies right now — that's what lets each table quietly become "real" on its own, one at a time, as the plan actually gets built, without redesigning the doc. When a previously-planned table shows up in real ground truth, that's ordinary content drift: remove its marker and document it like any other table, the same way "Maintaining an existing doc" handles any other update.

## Verify before closing

Re-establish ground truth one more time here — using the same detection method as "Establish ground truth," not just recalling what was written earlier in this pass — and reconcile the doc against that enumerated table list one by one, not from memory. This catches both gaps from the start and drift introduced while writing.

- [ ] Every table in ground truth has a schema entry
- [ ] Scope and Conventions sections are present before the first chapter
- [ ] Every table states what one row represents
- [ ] Every table states its lifecycle (creation/update/deletion triggers, plus any query-pattern implication)
- [ ] Every column is listed with type, nullability, and constraints/notes; every nullable column states what NULL means; every column that changes after insert states its trigger or the explicit fallback token; every deprecated column is marked DEPRECATED with a plan or the explicit fallback token
- [ ] Every index, check constraint, and unique constraint is documented
- [ ] Every FK edge label ends with its bare `ON DELETE` rule keyword, and the ERD is followed by the standard legend
- [ ] Every enum's values are spelled out
- [ ] Every JSONB/JSON column has its expected structure documented
- [ ] Every chapter (or the whole doc, if flat) has an ERD
- [ ] Every ERD entity that filtered out columns shows `+ N columns`
- [ ] Every FK-less table has its reason stated
- [ ] Every table's triggers, and the functions they call, are documented — or stated as none
- [ ] Every not-yet-implemented table/column cites its planned migration if one's drafted, or states none drafted yet; no existing table carries a migration citation
- [ ] Every table's RLS policies and non-default grants are documented — or stated as none
- [ ] Every view and materialized view is documented, including materialized-view refresh strategy
- [ ] Every table that was in the doc but no longer exists in ground truth is flagged in a "Removed tables" note (its chapter's, or the doc's if flat), never just deleted
- [ ] Exactly one schema doc exists for the repo
- [ ] Anything not yet implemented is marked as such
- [ ] No closed ticket/issue/epic/AC/ADR/decision reference remains anywhere in the doc — the rule itself is stated in plain language, and only genuinely open references are kept

## Maintaining an existing doc

If "Locate the doc" found an existing schema doc, take this branch instead of authoring from scratch. Two separate things can be wrong with it, and neither implies the other:

- **Content drift** — the doc's facts are stale relative to ground truth (a table, column, index, or FK changed). Re-establish ground truth, diff it against the doc, and update only what changed. Don't regenerate the whole doc from scratch over a handful of changed tables; that throws away conventions and cross-references the doc has already accumulated. A table that's disappeared from ground truth is never just deleted from the doc — add a one-line entry (table name, and why/when if known) to a "Removed tables" note, the same explicit-marking pattern used for not-yet-implemented and FK-less tables. In a chaptered doc, the note goes at the end of the table's chapter; in a flat doc (no chapters), it goes at the end of the doc, after the table schemas. Structure (flat vs. chaptered) is fixed once chosen and isn't re-evaluated by a maintenance pass, even if the table count crosses the 8-table threshold.
- **Structural incompleteness** — the doc's facts can be entirely accurate and still not meet what this skill requires, most often because the doc predates this skill or was written by a different process (no ERD, no Lifecycle paragraphs, no Scope/Conventions preamble). Zero content drift never implies the structure is complete. Check the existing doc against every requirement in this skill and its reference files regardless of whether any content actually changed, and backfill whatever's missing from ground truth.

Re-run the checklist above after updating either kind of gap.
