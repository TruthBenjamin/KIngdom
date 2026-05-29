# Marketplace Architecture

Date: May 28, 2026

## Decision

Kingdom Marketplace is now service-first. `services` is the canonical marketplace entity for discovery, messaging, orders, saved items, payments, and reviews.

`listings` is deprecated. Existing rows can be migrated into `services.legacy_listing_id`, but no new application workflow should read or write `listings`.

## Canonical Relationships

- `users` own buyer and seller identities.
- `seller_profiles.user_id -> users.id` stores seller-specific profile and verification state.
- `buyer_profiles.user_id -> users.id` stores buyer onboarding and brief defaults.
- `services.seller_id -> users.id` is the marketplace supply unit.
- `saved_services.service_id -> services.id` stores buyer shortlists.
- `orders.service_id -> services.id` stores the purchased service. No production order is valid without it.
- `conversations.service_id -> services.id` stores pre-order service context.
- `conversations.order_id -> orders.id` stores order-specific threads.
- `reviews.order_id -> orders.id` and `reviews.service_id -> services.id` make reviews purchase-verified.
- `profiles.rating` and `profiles.reviews_count` are derived from published, completed-order reviews.

## Real Workflow Model

- Sellers save services as drafts, then submit them into `pending_review`.
- Only `services.moderation_status = active` and `is_active = true` services appear publicly.
- Seller onboarding tracks profile completion, category specializations, portfolio links, and verification notes.
- Checkout captures buyer requirements, scope confirmation, terms acceptance, fee breakdown, and cancellation policy before an order exists.
- Order detail pages are the operational surface for timeline, requirements, deliveries, revisions, acceptance, cancellation, disputes, and verified reviews.
- Reviews are submitted through `submit_completed_order_review` and require a completed order owned by the buyer.

## Migration Strategy

New environments should start from `supabase/schema/canonical.sql`.

Existing environments should run:

1. Current historical schema/upgrades in their existing order if they have not been applied.
2. `supabase/migrations/20260528190000_canonical_service_marketplace.sql`.
3. `supabase/migrations/20260529150000_scale_search_realtime_security.sql`.
4. `npm run db:types` after the database is migrated.

The canonical migration:

- backfills services from legacy listings;
- copies legacy listing references into `services.legacy_listing_id`;
- backfills `orders.service_id`;
- backfills `conversations.service_id`;
- backfills `reviews.service_id` and `reviews.order_id` where completed order evidence exists;
- requires `orders.service_id`;
- requires reviews to reference an order and service;
- adds service search vectors and indexes;
- replaces order creation and conversation creation RPCs with service-only inputs.

The scalability migration:

- adds indexed ranked search through `marketplace_search_services`;
- ranks with text relevance, category fit, seller quality, verification, response time, featured state, and recency;
- returns stable paginated service IDs and total counts;
- adds `get_inbox_summaries` for unread counts and conversation previews;
- adds `mark_conversation_read` and `send_conversation_message` as narrow messaging mutations;
- scopes typing and presence policies to conversation participants;
- adds indexes for unread messages, conversation inbox ordering, typing, and presence.

## Domain Structure

`domains/` is the ownership boundary for app behavior:

- `auth`: session, role routing, protected redirects.
- `buyers`: saved services, buyer dashboard data, buyer settings.
- `sellers`: seller profile, service publishing, seller dashboard data.
- `marketplace`: service search, categories, service details, cards.
- `messaging`: conversation creation, message helpers, realtime boundaries.
- `reviews`: completed-order review actions and reputation updates.
- `payments`: order lifecycle, beta payment state, wallets, withdrawals.
- `onboarding`: post-auth role selection and profile completion.
- `moderation`: service, review, user, and abuse queues.

## Refactor Rules

- Pages should compose domain data, actions, forms, hooks, and UI shells.
- Mutations that affect roles, services, orders, payments, reviews, or moderation belong in server actions or RPCs.
- Client components should own interaction state, not authorization or lifecycle rules.
- Marketplace reads should use database-backed filters, indexes, and stable pagination.
- Realtime subscriptions should be per-user for inbox/message events and active-conversation-only for typing/presence.
- Client-side messaging should call RPCs for send/read mutations instead of writing broad table state directly.
- Manual database types must be regenerated from schema with `npm run db:types`.
