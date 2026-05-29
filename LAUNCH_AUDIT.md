# Kingdom Marketplace Launch Audit

Date: May 28, 2026

Update, May 29, 2026: the scalability pass added database-ranked service search, stable pagination, scoped inbox summary RPCs, active-conversation typing/presence subscriptions, narrower message read/send RPCs, additional indexes, and a remote image allowlist. A beta trust pass added admin moderation queues, seller verification operations, abuse reports, suspicious activity signals, notification center support, category management, manual adjustment placeholders, and admin audit logs. The product still needs real payment infrastructure, storage hardening beyond attachment URL validation, tests, and production observability before broad public launch.

## Executive Summary

Kingdom Marketplace is a promising MVP, but it is not public-launch ready. The application compiles and the core screens exist, yet many workflows are only partially real. The product currently feels like a stitched-together demo: strong visual direction in places, but inconsistent data models, simulated payments, shallow search, incomplete onboarding, missing moderation, and trust claims that are not fully backed by system behavior.

The biggest issue is not one bug. It is product-system coherence. The app has evolved from `listings` to `services`, from basic messages to realtime messaging, and from simple hiring to escrow, but the architecture still carries all versions at once. That creates fragile logic, duplicated concepts, stale documentation, and user journeys that look finished before they actually are.

The app should not continue major feature expansion until the marketplace foundation is stabilized.

## Audit Scope

Reviewed:

- Frontend routes and component structure.
- Authentication and role handling.
- Buyer, seller, messaging, payments, and admin dashboards.
- Marketplace browsing, filtering, category routing, listings, and saved services.
- Supabase schema, SQL upgrades, RLS policies, server actions, RPC functions, and storage policies.
- Loading, error, and empty states.
- Build and type health.
- Product realism, trust signals, and marketplace logic.

Verification performed:

- `npm run type-check`: passed.
- `npm run build`: passed.

Passing build status only proves the current code compiles. It does not prove the workflows are production-safe.

## Critical Issues

### 1. Payments Are Simulated But Presented Like Escrow

The app repeatedly uses "escrow-backed" language while the payment gateway always confirms payment locally. There is no real card/bank/mobile-money authorization, no provider webhook, no anti-fraud layer, no payment reconciliation, and no payout rail.

Risk:

- Users may believe real funds are protected.
- Sellers may believe earnings are withdrawable.
- Admin may see financial dashboards that look real but are not financially authoritative.

Launch decision:

- Do not market escrow as real until a payment provider, webhook validation, ledger integrity, and payout process exist.

### 2. The Data Model Has Conflicting Marketplace Concepts

The app uses both `listings` and `services`. `listings` exist in the base schema, while newer marketplace pages use `services`. Orders can reference both. Reviews reference `listings`, but the current public marketplace is service-based. This split creates inconsistent source-of-truth behavior.

Examples:

- Seller dashboard says "Listings publish to services."
- Reviews are tied to `listing_id`, not `service_id` or `order_id`.
- Service detail pages load reviews by seller, not by the specific service.
- Seed data must insert both listing and service rows.

Risk:

- Review integrity becomes weak.
- Order history cannot clearly answer "what exactly did the buyer buy?"
- Future features will repeatedly choose between old and new tables.

Launch decision:

- Consolidate around `services` as the marketplace unit and either retire `listings` or clearly define it as a legacy/backing table.

### 3. Auth Role Flow Is Inconsistent

Google signup does not ask whether the user is a buyer or seller, so OAuth users default to buyer behavior unless metadata exists. Email login always redirects to `/dashboard/buyer`, even if the account is a seller or admin. The callback route handles roles better than email login.

Risk:

- Sellers land in buyer dashboard after login.
- Users may create the wrong account type.
- Role-based onboarding feels unreliable.

Launch decision:

- Introduce post-auth onboarding and always route by `dashboardPathForRole`.

### 4. RLS Policies Allow Risky Direct Client Writes

Several sensitive objects are editable from client-side Supabase calls, relying heavily on RLS and broad "participants can update" policies.

Concerns:

- Message status updates can be made by sender or receiver.
- Order update policies were changed across upgrade files and depend on final execution order.
- Seller service creation is direct from the client instead of a validated server action.
- Users can update their own role to seller through the client flow.

Risk:

- Hard-to-audit authorization behavior.
- Future policy drift.
- Business rules split between UI, RLS, and RPC.

Launch decision:

- Move role transitions, service publishing, order lifecycle, and financial actions behind server actions/RPC with narrow permissions.

### 5. Trust Claims Are Ahead Of System Reality

The UI says "vetted services," "verified," "escrow-backed," "marketplace quality," and "trust signals." The system does not yet include a real verification workflow, moderation queue, seller identity checks, service approval workflow, review-after-order validation, dispute handling, or enforceable delivery standards.

Risk:

- Trust-breaking UX when users discover the claims are decorative.
- Higher support burden.
- Marketplace credibility damage.

Launch decision:

- Rename claims conservatively until workflows exist.

### 6. Search And Ranking Are Not Marketplace-Grade

Search uses basic `ilike` filters on title, description, and category. "Popular" and "top rated" sort happen in memory after only 24 rows are fetched. This means the best results may never be loaded before sorting.

Risk:

- Search results are misleading.
- Ranking quality degrades as data grows.
- Category pages cannot scale.

Launch decision:

- Add database-backed full-text search and proper ranking queries before adding many sellers.

### 7. Messaging Realtime Design Is Expensive And Broad

The messaging component subscribes to all `typing_status` and `user_presence` changes, then filters client-side. It also fetches all messages for conversation IDs and manually calculates last messages and unread counts.

Risk:

- Realtime noise increases with every active user.
- Mobile clients waste bandwidth.
- Larger inboxes will slow down.

Launch decision:

- Scope realtime subscriptions to active conversation/user-specific rows and use database views/RPC for inbox summaries.

### 8. Documentation Is Stale And Misleading

The README claims Next.js 15, React 19, Framer Motion, admin moderation, and other items that do not match `package.json` or current implementation. The README also contains mojibake/corrupted characters.

Risk:

- Developers follow wrong setup instructions.
- Investors/testers see inconsistency.
- New contributors waste time.

Launch decision:

- Update documentation before onboarding collaborators.

### 9. The App Has No Real Moderation System

There is an admin finance dashboard, but no real user/service/review/message moderation dashboard. The README claims remove listings and ban users, but current admin route is finance-focused.

Risk:

- Bad listings, fake profiles, bad reviews, and abuse cannot be managed.
- Marketplace trust collapses as soon as public users enter.

Launch decision:

- Build moderation before public seller onboarding.

### 10. Reviews Are Not Trustworthy

Reviews can be seeded and are tied to listing/buyer uniqueness, not completed orders. There is no review submission flow after order completion, no proof that the buyer purchased the service, and seller ratings are stored separately on `profiles`.

Risk:

- Ratings can drift from actual reviews.
- Reviews cannot be trusted as purchase-verified.
- Seller reputation is easy to misrepresent.

Launch decision:

- Make reviews order-based and compute seller rating from verified completed order reviews.

## Medium-Priority Issues

### Onboarding Is Too Thin

Buyer and seller onboarding exists as forms, but it does not guide users through a realistic setup path.

Problems:

- No required seller verification path.
- No portfolio upload.
- No profile preview.
- No category selection from controlled taxonomy.
- No service draft/review/publish workflow.
- Buyer profile data is not meaningfully reused during checkout or messaging.

### Seller Service Publishing Is Underengineered

The seller dashboard publishes services immediately from a compact form.

Problems:

- No image upload.
- No package tiers.
- No deliverable structure.
- No FAQ.
- No availability/capacity rules.
- No approval state.
- No category dropdown tied to `categories`.
- No slug conflict handling visible to user.
- No strong validation beyond title/description.

### Buyer Order Flow Is Too Abrupt

Clicking "Book" creates an order immediately and sends the buyer to payments. There is no checkout confirmation, scope review, requirements collection, terms acceptance, cancellation rule, or fee breakdown before order creation.

### Payment Dashboard Mixes Buyer And Seller Mental Models

The same dashboard handles buyer escrow actions, seller delivery actions, wallet balances, withdrawals, delivery defaults, transactions, and order management. It works for an MVP but lacks clarity.

Problems:

- Buyers see withdrawal form patterns if they have balances.
- Sellers see buyer-style payment flows.
- No clear order detail page.
- Delivery defaults are global component state, not per-order delivery composition.

### Admin Finance Is Not Enough For Admin Operations

Admin finance is useful, but admin needs broader control:

- User management.
- Seller verification.
- Service approval/rejection.
- Review moderation.
- Dispute handling.
- Conversation abuse reports.
- Category management.
- Refunds and manual ledger adjustments.

### Dashboard Navigation Is Inconsistent

Seller dashboard has a custom sidebar. Buyer dashboard uses card shortcuts. Payments and messages are standalone surfaces. Header remains globally visible on dashboards, creating duplicate navigation.

### Empty States Reveal Unfinished Product Thinking

Some empty states are helpful, but others say things like "The next implementation step..." This should never appear in a customer-facing product.

### Notifications Are Mostly Decorative

The marketplace page has a notification bell with no behavior. Notification rows are created in the database, but there is no notification center, read flow, or cross-app badge strategy.

### Saved Services Work But Are Thin

Saving persists, but:

- There is no save from service cards.
- No folders/shortlists.
- No compare view.
- No notes.
- No notification when saved service changes.

### Category Routing Is Shallow

Category pages are mostly filtered marketplace pages with static trust copy. There is no category-specific metadata, SEO depth, featured collections, seller counts, or category-specific filters.

### Mobile Filtering Is Incomplete

The mobile "Filters" button is rendered but does not open a filter panel. Desktop filters are hidden on mobile, so mobile users lose important controls.

### Error Handling Is Too Quiet

Many data loaders log errors to `console.error` and show empty states. Users and operators will not know whether there is no data or the system failed.

## Low-Priority Issues

- Mixed visual language: custom dashboard panels, shadcn-style cards, marketplace panels, and static pages do not feel fully unified.
- Several pages use generic marketing copy that sounds confident but not specific.
- Header search is visual only and not interactive.
- "Categories" nav links to `/marketplace`, not a true category index.
- The home page uses hardcoded service cards instead of live marketplace data.
- Some strings show encoding artifacts in existing docs and UI text, such as `Â·` in seller dashboard output.
- `types/index.ts` is stale compared with `types/database.ts`.
- `zustand`, `react-hook-form`, and `zod` are installed but barely used or unused.
- Service media accepts arbitrary URLs, creating quality, security, and broken-image risks.
- Remote image config allows any HTTPS hostname.
- No consistent skeleton strategy outside a few route loading files.
- Static policy pages exist but should be reviewed by legal before launch.

## UX Realism Analysis

The user experience currently looks more complete than it behaves.

Strong points:

- The marketplace and listing pages are visually credible.
- Buyer and seller roles are understandable.
- Service cards expose useful decision data: price, rating, delivery, category, and revisions.
- Messaging UI has real interaction patterns.
- Seller publishing is approachable.

Trust-breaking UX:

- "Escrow-backed" is visible before real payment infrastructure exists.
- "Verified" can be seeded or manually stored without visible verification process.
- Notification buttons do not work.
- Mobile filter button does not work.
- Login sends all email users to buyer dashboard.
- The buyer dashboard includes a "Next marketplace step" card that reads like an internal product note.
- Seller dashboard empty state references implementation work.
- Hardcoded home content may not match actual marketplace supply.

UX gaps before launch:

- Proper checkout review page.
- Order detail page with timeline.
- Buyer requirement submission during booking.
- Seller delivery composer per order.
- Revision thread tied to deliverables.
- Clear cancellation/refund/dispute UX.
- Notification center.
- Seller public profile pages.
- Service preview before publish.
- Image upload and crop workflow.

## Marketplace Realism Analysis

The marketplace model is currently "service cards plus chat plus simulated escrow." That is a good prototype, but not yet a believable service marketplace.

Missing marketplace primitives:

- Seller verification.
- Service approval workflow.
- Portfolio evidence.
- Package tiers.
- Availability and capacity.
- Order cancellation policy.
- Dispute workflow.
- Review-after-completion workflow.
- Commission/payout policy display.
- Seller response SLA tracking.
- Buyer requirements intake.
- Fraud and abuse controls.
- Search relevance scoring.
- Category taxonomy governance.

Pricing realism:

- Services have one price, but many real service marketplaces need packages, add-ons, rush delivery, custom quotes, and milestones.
- `price_min`/`price_max` exists in `listings`, while `services` has only `price`.

Supply realism:

- Sellers can publish instantly.
- No approval queue or profile quality enforcement.
- No way to inspect seller portfolio beyond service image and text.

Demand realism:

- Buyers can book without confirming scope.
- Buyer profile data does not prefill order requirements.
- No project brief is attached to order creation.

## Scalability Analysis

Current scale target should be small private beta only.

Scalability blockers:

- In-memory ranking after limited result fetch.
- Realtime subscriptions that listen too broadly.
- Client-side dashboard fan-out queries.
- No pagination on many dashboard views.
- No cursor pagination for marketplace beyond fixed limit.
- No materialized seller stats or order summary views.
- No database search vector.
- No rate limiting.
- No server-side caching strategy.
- Remote images from arbitrary domains.
- No observability or error reporting.

Recommended scalable patterns:

- Database-backed search with full-text indexes.
- Search result pagination and stable sort keys.
- Inbox summary view/RPC.
- Role-scoped dashboard summary RPCs.
- Server actions for mutations.
- Per-user realtime channels only.
- Background jobs for notifications and emails.
- Audit ledger for financial state.

## Architecture Weaknesses

### Patchwork SQL Upgrades

The database is built through a base schema plus multiple upgrade files. That is workable in early development, but there is no migration tool or canonical schema snapshot.

Risk:

- Fresh database setup depends on exact file order.
- Policies are dropped and recreated across files.
- Future changes are hard to reason about.

Recommendation:

- Adopt a migration system and generate a clean baseline migration before beta.

### Business Logic Is Split Across Too Many Layers

Some behavior lives in client components, some in server actions, some in SQL RPCs, and some in RLS policies. There is no clear boundary.

Recommendation:

- Use server actions/RPC for mutations, server components/RPC for reads, and client components only for UI state.

### Dashboard Components Are Too Large

Several pages are large client components with fetching, state management, mutation logic, layout, forms, and rendering in one file.

Examples:

- Seller dashboard.
- Realtime messenger.
- Payment dashboard.
- Admin finance dashboard.

Recommendation:

- Split into feature modules: data access, actions, forms, tables, cards, and page shells.

### Types Are Manually Maintained

`types/database.ts` appears manually aligned with SQL. `types/index.ts` is stale. This creates drift risk.

Recommendation:

- Generate Supabase types from the live schema or migrations.

### No Test Architecture

There are no automated tests for the most sensitive workflows: order creation, payment confirmation, delivery, revision, release, withdrawal, auth role routing, and RLS expectations.

Recommendation:

- Add unit tests for pure helpers, integration tests for RPCs, and Playwright tests for core journeys.

## Product Coherence Analysis

The product direction is clear: a faith-centered services marketplace for ministries and Christian creators. The coherence breaks down at the workflow level.

What works:

- The audience is specific.
- The service categories make sense.
- Buyer and seller dashboards are logical first steps.
- Messaging plus escrow is a strong marketplace foundation.

What feels incoherent:

- The homepage markets broad creative services, but seeded data is mostly ministry services.
- README claims admin moderation, but the app has admin finance.
- "Verified" and "vetted" appear before verification is implemented.
- Buyers can book instantly, but many services require custom scope.
- Dashboard language sometimes sounds internal rather than user-facing.
- Payment and escrow language suggests production finance, while implementation is simulated.

Product recommendation:

- Reposition the current state as a private-beta marketplace prototype until trust workflows are implemented.

## Technical Debt Analysis

High debt:

- Legacy `listings` plus newer `services`.
- Dual order status fields: `status` and `order_status`.
- Manual SQL upgrade chain instead of migrations.
- Simulated payment abstraction wired into production-looking dashboard.
- Large monolithic client components.
- Stale docs.
- Manual database types.

Medium debt:

- Repeated dashboard data-loading patterns.
- Repeated auth redirect logic.
- Query error handling through `console.error`.
- Inline color-heavy styling everywhere.
- Custom sidebar navigation only on seller dashboard.
- Hardcoded homepage marketplace content.

Low debt:

- Unused dependencies.
- Some outdated copy.
- Limited skeleton/loading consistency.
- Encoding artifacts in docs and UI.

## Security Concerns

Highest concerns:

- Financial actions depend on simulated payment confirmation.
- Public storage bucket allows anyone to read message attachments.
- Remote image allowlist accepts every HTTPS host.
- Broad realtime publication of presence/typing tables.
- Client-side writes for seller profiles and services.
- Role conversion from buyer to seller happens client-side.

Additional concerns:

- No rate limiting for messages, service publishing, or order creation.
- No anti-spam controls.
- No abuse reporting.
- No admin audit trail for finance actions except partial transaction/order events.
- No ban enforcement observed in app logic, despite `is_banned` existing.
- No MFA or admin hardening.

## Performance Concerns

- Marketplace searches are dynamic and uncached.
- Sorting by rating happens after limited rows are fetched.
- Seller dashboard launches several independent queries on every load.
- Buyer dashboard launches several independent queries on every load.
- Messaging inbox computes last messages and unread counts manually.
- Global header runs session lookup client-side.
- Images are mostly remote Unsplash URLs.
- No pagination for dashboards.

## Responsiveness Concerns

- Marketplace mobile filters button is non-functional.
- Seller dashboard sidebar disappears on mobile without equivalent dashboard navigation.
- Payment dashboard tables/cards may become difficult with many orders.
- Messaging has a mobile inbox toggle, but active conversation selection via URL is not handled.
- Large hero and marketplace card layouts are image-heavy on mobile.

## Critical Recommendations

1. Stop calling the current payment flow real escrow.
2. Consolidate marketplace data around `services`.
3. Build a real order detail and checkout flow.
4. Fix auth routing and role onboarding.
5. Move sensitive mutations behind validated server actions/RPC.
6. Build review-after-completed-order only.
7. Add seller verification and service moderation.
8. Replace shallow search with database-backed search.
9. Scope realtime subscriptions.
10. Update README and public docs.

## Suggested Implementation Order

### Phase 1: Stabilize Trust And Truth

1. Rename all "escrow-backed" claims unless real payments are implemented.
2. Remove or reword fake notification/filter buttons.
3. Fix email login role redirect.
4. Remove internal copy from empty states.
5. Update README to match actual stack and features.
6. Add `LAUNCH_AUDIT.md` and keep it as the product risk register.

### Phase 2: Clean The Marketplace Foundation

1. Decide whether `services` replaces `listings`.
2. Migrate reviews and orders to service/order-based relationships.
3. Replace manual service category input with category selection.
4. Add service drafts, previews, and moderation states.
5. Add image upload for service media.
6. Add service detail validation and better slug conflict handling.

### Phase 3: Make Order Flow Real

1. Add checkout page before order creation.
2. Capture buyer requirements.
3. Create order detail page with status timeline.
4. Add seller delivery composer.
5. Add buyer revision/acceptance UX.
6. Add cancellation and dispute states.
7. Add order-based reviews.

### Phase 4: Make Finance Launch-Safe

1. Choose payment provider.
2. Implement payment intents and webhooks.
3. Build immutable ledger entries.
4. Separate buyer payments from seller wallet UI.
5. Add admin payout workflow and audit logs.
6. Add refund/dispute handling.

### Phase 5: Scale Search And Realtime

1. Add full-text search indexes.
2. Add database ranking.
3. Add pagination.
4. Add seller stats/search materialized views if needed.
5. Replace broad realtime subscriptions with scoped subscriptions.
6. Add notification center and email notifications.

### Phase 6: Harden For Public Beta

1. Add Playwright core journey tests.
2. Add database/RPC integration tests.
3. Add error reporting.
4. Add rate limiting and abuse controls.
5. Add admin moderation dashboard.
6. Add privacy/legal review.
7. Add production monitoring.

## Launch Readiness Verdict

May 29 polish update:

- Trust language was softened where the system is still a beta workflow rather than real escrow.
- Buyer, seller, and payment dashboard loading states now use layout-preserving skeletons instead of spinner-only waits.
- Login/signup copy, disabled states, and password placeholder encoding were cleaned up.
- Internal implementation copy was removed from buyer and seller dashboard helper text.
- Payments/orders now has a clearer empty state and less misleading fee language.
- `LAUNCH_READINESS_REPORT.md` was added with the final QA report, launch checklist, performance checklist, unresolved debt list, and beta deployment recommendations.

May 29 systems update:

- Added `REAL_SYSTEMS_AUDIT.md` with verified bugs, fixes, architecture weaknesses, security risks, performance bottlenecks, and remaining debt.
- Added an authenticated app-user persistence RPC so Supabase Auth users are normalized into `public.users`.
- Moved role onboarding and seller activation/profile/service mutations behind server action/RPC boundaries.
- Prevented sellers from self-publishing services that have not passed moderation.
- Repaired canonical schema ordering, missing `orders.status`, and missing runtime tables used by the app.
- Removed invalid conversation conflict handling and made seed data safer to rerun.

Current readiness: private prototype / controlled demo.

Not ready for:

- Public seller onboarding.
- Real buyer payments.
- Real escrow claims.
- Paid marketing.
- Large catalog growth.
- Unmoderated usage.

Ready for:

- Internal demos.
- Design validation.
- Private beta with hand-held users.
- Workflow testing with fake payments clearly labeled.

The product has a good direction, but it needs foundation work before new features. The next best engineering move is not adding more screens. It is making the existing workflows honest, coherent, and enforceable.
