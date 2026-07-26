# Table schema format

Disclosed reference for [database-schema-documenter](../SKILL.md). This is the doc's fullest record of a table — every field, no exceptions, even ones already visible on an ERD — but it's still a description of ground truth, not the source of truth itself; the real database and its source code are.

## State why, not where

Every section below asks for the reasoning behind a rule — a nullable column's meaning, a mutability trigger, a delete strategy. State the rule itself, in plain language. Don't cite the ticket, issue, epic, AC, ADR, or decision record that produced it once that work is closed or resolved — a closed reference tells a reader where to dig through project history, not why the system behaves this way today, and it rots the moment the tracker link changes or the ticket gets archived. Write `expires_at = creation + 60 minutes`, not `expires_at = creation + 60 minutes (AC-AUTH-029/030)`, and not `tags — migration 0005 (E02-05)`.

The one exception: a reference to something still open — an unresolved question, a to-do, a planned change — is worth keeping, since it tells the reader the current behavior isn't necessarily final. That's exactly why "Migration reference" below only ever cites a migration that hasn't run yet — a migration that already created or altered a table is "when," not "why," same as a closed ticket.

## Header

Start every table's section — regardless of how obvious the name seems — with one sentence answering "what does one row represent?" (e.g. "Represents someone a Payment can be sent to, e.g. a law firm," or "1:1 with what a user sees on `/transactions`"). If the name alone doesn't make the stored entity type unambiguous, fold that clarification into the same sentence. Where it adds real understanding, add a second sentence on how the table fits the product — not just what type of row it stores, but why it exists (e.g. "linked through Plaid" for an external-accounts table).

## Lifecycle

One short paragraph, table-level (distinct from any single column): when rows are created (what triggers an insert), whether and when they're updated (or "immutable after creation"), and how deletion actually works — hard delete, soft delete via a flag/timestamp per the doc's Conventions, or never deleted. State any query-pattern implication this creates, e.g. "always filter `deleted_at IS NULL`" or "a `LEFT JOIN` is required here since a row may not exist yet for pending signups."

This is behavioral, not structural — a live DB connection or migrations can't reveal it, since a database has no way to record *why* or *when* something happens, only the shape of the result. A DB-level trigger (an actual Postgres/MySQL `TRIGGER`) is structurally visible and belongs in "Triggers and functions" instead. Application-level behavior (an API endpoint that soft-deletes, a cron job that hard-deletes stale rows) only lives in application source code — check it regardless of which structural ground-truth source is primary, before writing this paragraph.

If the doc's Conventions section names a default/global delete strategy, this paragraph only needs to name which strategy this table uses and record any deviation from that default — never restate the mechanism itself (e.g. don't redefine what "soft delete" means here if Conventions already did). If Conventions doesn't name a single default (e.g. the repo genuinely mixes soft and hard delete by table), state this table's strategy directly instead of framing it as a deviation.

## Column table

One row per column, no omissions:

| Column | Type | Nullable | Default | Constraints / notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | no | — | FK → `users.id`, `ON DELETE RESTRICT` |
| `status` | `enum` | no | `'pending'` | values: `pending`, `paid`, `refunded`, `cancelled` |
| `metadata` | `jsonb` | yes | — | see JSONB structure below |
| `refunded_at` | `timestamptz` | yes | — | NULL unless the payment has been refunded |
| `last_status_check_at` | `timestamptz` | yes | — | re-checked with the payment processor every 15 minutes while `status = 'pending'` |
| `legacy_region` | `text` | yes | — | DEPRECATED — superseded by `region_id`; backfill in progress, remove after 2026-Q3 |

Every enum column's full value set is spelled out in the constraints/notes column, not left as "see code." The constraints/notes column carries more than the constraint itself — for a nullable column, state what NULL *means*, not just that it's allowed; for a column that changes after insert, check application source code (same reasoning as Lifecycle above — this is behavioral, not structural) and state what triggers the update, or `update trigger not determinable from ground truth` only once source code has actually been checked and still doesn't reveal it; for a column being phased out, mark it `DEPRECATED — <reason>` and state the backfill/removal plan, or `no removal scheduled` if none exists. If ground truth is a plan (no code exists yet — see SKILL.md's "Establish ground truth" tier 5), the check is trivially satisfied: use the fallback token immediately unless the plan itself names a trigger. If the plan doesn't specify a column's type or nullability at all, state `type/nullability not specified in plan` rather than inventing or leaving the cell blank.

## Indexes, checks, unique constraints

List separately from the column table, one line each:

- **Indexes**: name, columns, type (btree/gin/etc.), and why it exists if not obvious (e.g. "supports the `status + created_at` dashboard query").
- **Check constraints**: name and the actual condition.
- **Unique constraints**: name and the column set.

## JSONB / JSON structure

For any JSON-typed column, document the expected shape as if it were its own mini-schema — field names, types, and whether each is required:

```
metadata: {
  source: string (required, one of: "web", "api", "import")
  campaign_id: string | null
  tags: string[] (optional)
}
```

If the structure varies by another column's value (a discriminator), document each variant separately and name which column selects between them.

## Data distribution

Only when ground truth reveals a column's actual data genuinely surprises its declared type or name — e.g. a `last4` column that's usually 4 digits but is sometimes 2, 3, or NULL in practice. Document the real distribution and the query used to verify it, so the fact is falsifiable rather than asserted:

```sql
-- last4: distribution of actual lengths
SELECT length(last4), count(*) FROM payment_methods GROUP BY 1;
```

Skip this section entirely when a column's data matches its declared shape — it's not required per column, only where reality diverges from what the schema implies.

## No-FK tables

If a table genuinely has no foreign keys, that's stated once at the end of its chapter (not per-table) — see the SKILL.md checklist. Reasons are usually: pure lookup/reference table, denormalized by design, or FK intentionally omitted for a stated performance reason.

## Cross-chapter tables

A table already fully schema'd in another chapter (see "Decide flat vs. chaptered" in SKILL.md) doesn't get a second full schema section — replace it with a pointer in this exact form: `→ full schema in Chapter N: <Chapter name>`.

## Triggers and functions

Per table, one line per trigger: name, timing + event (`BEFORE INSERT`, `AFTER UPDATE`, etc.), and what it does in one sentence. If a trigger calls a stored function shared across several tables, describe that function once — in the chapter's shared-functions note, right after its tables' schemas — and just name it at each call site instead of repeating the description. A table with no triggers states that explicitly (`No triggers.`), same as the no-FK convention above.

## Migration reference

Only for a not-yet-implemented table or column (see "Mark what isn't real yet"): if a migration is already drafted or queued to create it, cite it in one line, e.g. `Planned in 2026_02_01_add_seat_invites.sql (not yet applied)`. If nothing's drafted yet, state `No migration drafted yet` rather than omitting the line.

For a table or column that already exists, don't cite which migration created or last altered it — that's a backward-looking "when," not the current schema's "why" (see "State why, not where" above). Migrations still function as a structural ground-truth source (see SKILL.md's "Establish ground truth"); this section only ever cites one that hasn't run yet.

## Row-level security & grants

Per table: any RLS policy (name, the role(s) it applies to, and its condition) and any non-default `GRANT`/`REVOKE`. A table with neither states that explicitly (`No RLS; default grants.`) — this is exactly the kind of fact that's easy to assume rather than verify, so it's never left implicit. For a planned table (nothing deployed yet), don't assert a deployed default — state `Not yet deployed; RLS/grants not applicable` instead.

## Views and materialized views

Documented once per chapter, after all of that chapter's table schemas — a view reads from tables but isn't one, so it doesn't belong nested under any single table. Per view: name, the base tables it reads, and its defining query (summarized in one paragraph if long rather than pasted in full). For a materialized view, also state its refresh strategy (manual, cron, trigger-driven) and why it's materialized instead of a plain view — usually a stated performance reason.
