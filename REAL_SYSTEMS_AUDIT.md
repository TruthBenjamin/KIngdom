# Kingdom Marketplace Real Systems Audit

Date: May 29, 2026

## Scope Verified

Reviewed against the actual repository:

- Auth/session flow: login, signup, OAuth callback, role onboarding, `useCurrentUser`, dashboard redirects.
- Marketplace flow: category/search pages, service detail, save/message/book/report actions, checkout, order creation.
- Seller flow: activation, profile updates, service draft/review lifecycle, service visibility controls.
- Buyer flow: saved services, dashboard metrics, checkout requirements, order detail, verified review action.
- Messaging flow: inbox summary RPC, active conversation loading, realtime message subscriptions, typing/presence subscriptions.
- Database flow: canonical schema, migrations, RPCs, RLS policy direction, seed data.

## Critical Bugs Fixed

- Fresh schema install could fail because `supabase/schema/canonical.sql` attempted to alter `orders`, `conversations`, `reviews`, and `services` before creating those tables.
- `orders.status` was used by SQL and TypeScript but was missing from the canonical `orders` table.
- Auth users could reach the app without a persisted `public.users` row, leaving dashboards and role logic dependent on missing relational data.
- Role onboarding and seller activation relied on broad client-side writes instead of a validated backend boundary.
- Seller service creation/editing was a direct client write, making publishing rules difficult to audit.
- Sellers could attempt to publish pending-review services directly from the dashboard.
- Messaging deep links like `/dashboard/messages?conversation=...` were ignored by the inbox component.
- Search fallback could build fragile Supabase `.or()` filters from raw query text containing delimiter characters.
- Seed data created duplicate orders, conversations, reviews, reports, and financial records on repeated runs.
- Fresh current-path RLS depended on legacy policies for several runtime tables.
- Buyer profile settings and saved-service mutations still used direct client table writes.
- Buyer dashboard performed several independent count/list queries instead of one scoped summary call.
- Fresh current-path trust migration referenced `is_admin()` even though that helper only existed in a legacy script.

## Verified Fixes

- Added `ensure_current_user_profile()` RPC and call it from `getSessionUser` so authenticated users have persisted app rows.
- Added `set_account_role()` RPC and switched role onboarding to a server action.
- Added seller workflow RPCs: `activate_seller_account`, `upsert_seller_profile`, `upsert_seller_service`, and `set_seller_service_visibility`.
- Switched seller dashboard mutations to server actions backed by those RPCs.
- Disabled seller visibility controls unless a service is admin-approved as `active` or `paused`.
- Repaired canonical schema ordering and added canonical `orders.status`.
- Added missing runtime tables to the canonical schema: wallets, saved services, order events, transactions, withdrawals, deliverables, platform revenue, notifications, message reads, typing status, and presence.
- Removed invalid conversation `ON CONFLICT` usage where the schema did not define a matching unique constraint.
- Updated generated database function types for the new RPC surface.
- Made seed orders/conversations deterministic and core seed inserts rerunnable.
- Added URL conversation selection to realtime messaging.
- Added a Suspense loading state for the messages route.
- Sanitized marketplace fallback search terms.
- Added current-path `is_admin()` helper and baseline RLS policies for users, profiles, categories, services, saved services, orders, wallets, transactions, withdrawals, deliverables, conversations, messages, reviews, notifications, and operations tables.
- Added `upsert_buyer_profile()` RPC and routed buyer settings through a server action.
- Added `set_saved_service()` RPC and routed save/remove actions through server actions.
- Added `get_buyer_dashboard_summary()` RPC so buyer dashboard counts and saved-service preview load through one scoped aggregate call.
- Replaced seller service category free text with active categories from the `categories` table.
- Added query limits to the payment dashboard order and withdrawal lists.

## Architecture Weaknesses

- Payment remains a beta/manual simulation; there is no provider intent, webhook verification, reconciliation, or payout rail.
- Buyer profile and saved-service writes now use RPC/server-action boundaries; realtime typing/presence still use scoped client writes by design.
- Admin operation components call moderation RPCs but still need broader automated authorization tests.
- RLS exists across sensitive tables, but the project still needs a policy-by-policy test suite.
- The app uses large client dashboard components that mix data fetching, mutation orchestration, and rendering.
- Canonical schema is now structurally aligned with the runtime tables, but it intentionally relies on later migrations for full workflow RPCs and policies.

## Scalability Issues

- Buyer dashboard uses a summary RPC; seller and payment dashboards still need deeper aggregate RPCs.
- Payment/order dashboards now have initial query limits, but full pagination controls still need to be added.
- Messages are paginated per conversation, but inbox route smoke/load testing still needs browser automation.
- Marketplace images are largely remote and should move to owned optimized assets before paid acquisition.
- Search has ranked database pagination, but fallback mode is less powerful if the RPC is unavailable.

## UX Inconsistencies

- Seller service category input uses active marketplace categories; buyer-facing category-specific guidance still needs refinement.
- Mobile seller navigation still relies on anchors inside a long page instead of a compact dashboard nav.
- Checkout/payment language is clearer now, but users still need explicit beta finance expectations in legal/support docs.
- Empty states are improved, but buyer and seller onboarding still need stronger guided completion flows.

## Security Risks

- Real payment security is absent until a provider and webhooks are integrated.
- Storage remains public for message attachments; URL validation helps but does not replace private signed access.
- Role, seller workflow, buyer profile, and saved-service mutations now have backend boundaries.
- Rate limiting exists in beta RPCs for some actions, but service publishing, checkout, and auth attempts need production abuse controls.
- Admin MFA and production audit monitoring are not implemented.

## Performance Bottlenecks

- Global header still performs client-side session lookup.
- Buyer dashboard uses an aggregate RPC; seller dashboard should be next.
- Large dashboard components should be split after bundle analysis.
- Order/payment pages need pagination and query limits for long-running accounts.

## Updated Architecture

- Auth identity is now normalized into `public.users` through `ensure_current_user_profile()`.
- Role selection is persisted through `set_account_role()`.
- Seller activation/profile/service workflows now route through server actions and RPC validation.
- Service visibility respects moderation state; pending services cannot be self-published by sellers.
- Reviews remain service/order-based, and seed data follows that model.
- Buyer profile and saved-service persistence now route through validated RPCs.
- Current fresh-install RLS no longer depends on legacy root scripts for core read boundaries.

## Production Readiness Checklist

- [x] TypeScript verification passes.
- [x] Production build passes after the previous launch pass; rerun required after these system changes.
- [x] Auth-to-app-user persistence has a backend path.
- [x] Seller workflow mutations have a backend path.
- [x] Canonical schema fresh-install blocker removed.
- [x] Canonical schema includes app-required runtime tables.
- [x] Seed data is rerunnable for core beta entities.
- [x] Buyer profile writes moved behind RPC/server action.
- [x] Saved-service writes moved behind RPC/server action.
- [x] Buyer dashboard aggregate RPC added.
- [x] Current-path `is_admin()` and baseline RLS policies added.
- [ ] Apply new migrations to Supabase and verify RPCs live.
- [ ] Run browser automation across auth, marketplace, checkout, messaging, orders, seller, buyer, and admin.
- [ ] Add RLS integration tests.
- [ ] Integrate real payment provider and webhooks.
- [ ] Add production monitoring, alerting, rate limits, and backup strategy.

## Remaining Technical Debt

- Add seller dashboard aggregate RPC and pagination.
- Add full pagination controls to payment/order dashboards.
- Add service media upload with ownership checks and file validation.
- Add private attachment delivery or signed URLs.
- Add dashboard summary RPCs and pagination.
- Add Playwright tests and database policy tests.
- Add provider-backed payments, immutable ledger checks, refund handling, and payout reconciliation.
