# Kingdom Marketplace Launch Risks

Date: May 28, 2026

This register documents known public-beta limitations. It is intentionally direct so the product does not overpromise before the marketplace is operationally ready.

## Current Beta Position

Kingdom Marketplace is suitable for controlled private beta testing with known users. It is not ready for an unmoderated public marketplace launch.

The current app supports marketplace browsing, service pages, saved services, buyer and seller dashboards, realtime messaging, protected marketplace workflow testing, and a beta payment system. Several trust-critical systems still need production hardening.

## Payment Limitations

- The beta payment system is not connected to a live payment provider.
- Payment confirmation is an internal state transition used for workflow testing.
- There is no provider webhook verification.
- There is no real card, bank, transfer, mobile-money, or wallet funding flow.
- There is no automated refund flow.
- There is no dispute-resolution payment hold/release process.
- Withdrawal requests are not connected to a payout provider.
- Platform revenue reporting is operationally useful for testing, but not a financial source of truth.

Required before public paid launch:

- Live provider integration.
- Webhook signature validation.
- Immutable financial ledger.
- Refund and dispute handling.
- Payout reconciliation.
- Admin audit trail for all financial actions.

## Moderation Limitations

- There is no full admin moderation dashboard for users, services, reviews, or messages.
- Seller verification is a profile status, not a complete identity or quality review workflow.
- Services can be published without admin approval.
- Reviews are not yet guaranteed to come from completed paid orders.
- There is no abuse reporting flow.
- There is no public ban enforcement path beyond the stored `is_banned` field.

Required before open signup:

- Seller review and approval queue.
- Service moderation queue.
- Review moderation and verified-order review rules.
- Abuse reporting.
- Ban enforcement in auth/session/app access.
- Admin action audit log.

## Marketplace Limitations

- Search is basic and does not use database full-text ranking yet.
- "Popular" and "top rated" sorting are limited by the current query strategy.
- Categories are simple taxonomy records, not fully governed marketplace verticals.
- Seller profiles do not include a full portfolio workflow.
- Service packages do not support tiers, add-ons, rush delivery, milestones, or custom quotes.
- Buyer requirements are not captured during checkout before order creation.
- Order detail pages and status timelines need to be expanded.

Required before catalog growth:

- Database-backed search.
- Pagination.
- Order detail workflow.
- Service draft/review/publish lifecycle.
- Portfolio and media management.
- Category governance.

## Messaging Limitations

- Realtime messaging works, but subscription scope should be tightened before high usage.
- Notification records exist, but there is not yet a complete notification center.
- Message attachments are stored in a public bucket, so privacy expectations must be managed carefully.
- There is no message abuse reporting or moderation queue.

Required before public launch:

- Scoped realtime subscriptions.
- Notification center.
- Private or signed attachment access strategy.
- Message reporting and moderation.

## Scalability Limitations

- Dashboard pages use multiple client-side queries.
- Marketplace search currently returns fixed-size result sets.
- Some ranking happens outside the database.
- There is no production observability or error reporting.
- There is no rate limiting for messages, order creation, or service publishing.

Required before broader beta:

- Query pagination.
- Server-side summary queries or RPCs.
- Error monitoring.
- Rate limiting.
- Load testing for realtime and marketplace search.

## Documentation Limitations

- `README.md`, `APP_FEATURES.md`, and this file reflect the current beta state.
- Older setup documents may still need review before external contributor onboarding.
- Legal pages should be reviewed before real payments or public customer acquisition.

## Public Beta Gate

Do not open public beta until these minimum gates are met:

- Payment language remains honest and does not imply live provider-backed funds protection.
- OAuth role onboarding is active.
- Mobile filters work.
- Fake notification controls are removed or replaced with functional notification UI.
- Seller publishing and order actions have clear user-facing limits.
- Admin can moderate users and services.
- Reviews are tied to completed orders or clearly labeled otherwise.
- Core buyer and seller journeys pass end-to-end testing.
