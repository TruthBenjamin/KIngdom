# Domain Architecture

Kingdom Marketplace now treats `services` as the canonical marketplace entity.
Domain folders own feature boundaries; app routes compose these modules instead of
recreating data access, auth redirects, mutations, and filters in page files.

## Marketplace Model

- `services` are the only public marketplace offers.
- `orders.service_id` is required for production orders.
- `reviews.order_id` and `reviews.service_id` are required, so reviews are tied to completed orders.
- `listings` are legacy migration input only and must not be used for new workflows.
- `conversations.service_id` connects pre-order buyer/seller messaging to the service being discussed.

## Migration Strategy

1. Run historical SQL only for existing local/demo databases that need to preserve old data.
2. Run `supabase/migrations/20260528190000_canonical_service_marketplace.sql`.
3. For new environments, use the canonical schema snapshot in `supabase/schema/canonical.sql`.
4. Generate database types from the applied schema before changing app code:

```bash
npm run db:types
```

## Boundaries

- `auth`: session, role routing, protected redirects.
- `buyers`: buyer dashboard, saved services, buyer profile.
- `sellers`: seller dashboard, service publishing, seller profile.
- `marketplace`: service discovery, service details, category browsing.
- `messaging`: conversations, messages, realtime state.
- `reviews`: completed-order review submission and reputation reads.
- `payments`: beta payment state, wallets, withdrawals, ledger events.
- `onboarding`: post-auth role and profile completion.
- `moderation`: service, review, user, and abuse review queues.
