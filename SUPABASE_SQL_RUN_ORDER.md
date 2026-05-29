# Supabase SQL Run Order

Use this file as the source of truth before pasting SQL into Supabase.

The repository contains two SQL families:

- **Current canonical path**: use this for a fresh database and for current product work.
- **Legacy upgrade path**: retained for older listing-based demo databases only.

Do not mix the two paths on the same fresh database.

## Recommended Fresh Install

Run one file at a time, in this order:

1. `supabase/schema/canonical.sql`
2. `supabase/migrations/20260528210000_real_marketplace_workflows.sql`
3. `supabase/migrations/20260529150000_scale_search_realtime_security.sql`
4. `supabase/migrations/20260529170000_beta_trust_operations.sql`
5. `supabase/seed.sql` optional, local/demo only

Notes:

- Stop immediately if a file errors. Fix that error before running the next file.
- `supabase/seed.sql` inserts demo rows into `auth.users`, so run it only in a local DB, Supabase SQL editor with sufficient privileges, or another admin/service-role context.
- Do not run demo seed data in production.
- If you already ran legacy root scripts on the database, do not assume the fresh install path is safe. Use the legacy path or reset the database first.

## Legacy Upgrade Path

Use this only for an older database that started from the legacy root schema and needs to be migrated forward.

1. `supabase-schema.sql`
2. `supabase-messaging-upgrade.sql`
3. `supabase-escrow-upgrade.sql`
4. `supabase-marketplace-architecture-upgrade.sql`
5. `supabase/migrations/20260528190000_canonical_service_marketplace.sql`
6. `supabase/migrations/20260528210000_real_marketplace_workflows.sql`
7. `supabase/migrations/20260529150000_scale_search_realtime_security.sql`
8. `supabase/migrations/20260529170000_beta_trust_operations.sql`
9. `supabase-realistic-seed-data.sql` optional, legacy demo only

Prefer `supabase/seed.sql` for canonical environments. Keep `supabase-realistic-seed-data.sql` only for legacy demo databases.

## Common Error Causes

- Running legacy root scripts after `supabase/schema/canonical.sql`.
- Running `supabase/seed.sql` without permission to insert into `auth.users`.
- Running seed files more than once against older non-idempotent demo data.
- Continuing after an earlier migration failed, leaving the database half-upgraded.
- Running files out of order, especially the workflow/search/trust migrations before the canonical schema exists.

## Quick Fresh Database Checklist

1. Confirm this is a new or intentionally reset database.
2. Run the four current schema/migration files in order.
3. Run `supabase/seed.sql` only if demo users and marketplace data are wanted.
4. Refresh the app and confirm marketplace services, inbox, orders, reviews, moderation, and dashboard pages load.
