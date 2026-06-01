# Kingdom Marketplace

Kingdom Marketplace is a faith-centered services marketplace for Christian creatives, ministries, churches, founders, and mission-led teams.

## Current MVP Features

- Email and Google OAuth authentication through Supabase Auth.
- Refined public home page matching the marketplace design direction, with compact search/navigation, generated creator collage imagery, category tiles, featured services, seller CTA, top creators, and trust signals.
- Database-ranked marketplace search with full-text relevance, category fit, seller quality weighting, recency weighting, stable sorting, and pagination.
- Service detail pages with seller profile context, reviews, related services, save, message, and book actions.
- Buyer dashboard with saved services, active chats, completed orders, and spending summary.
- Seller dashboard with profile onboarding, service creation/editing, service pause/publish, order summary, and earnings summary.
- Realtime buyer-seller messaging with scoped per-user inbox summaries, active-conversation typing/presence subscriptions, unread counts, read/delivery status, and attachments.
- Beta payment workflow for booking, payment confirmation, delivery, revision, completion, and withdrawal requests.
- Admin operations dashboard for user moderation, seller verification, service/review moderation, abuse reports, disputes, categories, manual adjustment placeholders, and audit logs.
- Notification center with unread states for messages, orders, moderation, verification, and system alerts.

## Important Launch Note

The current payment flow is a beta payment system for testing protected marketplace workflows. It is not connected to a live payment provider and should not be described as provider-backed funds protection until provider integration, webhook validation, ledger hardening, refunds, disputes, and payouts are implemented.

See [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md) for the launch-readiness audit and remediation plan.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Realtime, and Storage
- Lucide React icons
- React Hot Toast

## Frontend Design Notes

- The homepage uses a generated raster hero asset at `public/images/kingdom-creator-collage.png`.
- The visual direction is a clean white marketplace interface with charcoal actions, warm gold accents, compact 8px cards, and dense service discovery panels.
- The generated image prompt targeted photorealistic Christian creatives working across music, design, video, and writing, with no visible text, logos, or watermarks.

## Scalability Notes

- Marketplace browse uses the `marketplace_search_services` RPC for indexed full-text search, ranking scores, filtering, stable sort order, and paginated results.
- Messaging uses `get_inbox_summaries`, `mark_conversation_read`, and `send_conversation_message` RPCs to avoid client-side inbox fan-out and to keep message mutations validated.
- Realtime subscriptions are scoped to the current user for inbox/message events and the active conversation for typing/presence state.
- Remote optimized images are allowlisted to Unsplash and the configured Supabase project host instead of every HTTPS host.

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase project

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local` from `.env.local.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Database Setup

Use [SUPABASE_SQL_RUN_ORDER.md](./SUPABASE_SQL_RUN_ORDER.md) as the source of truth.

For a fresh/current database, run:

```text
supabase/schema/canonical.sql
supabase/migrations/20260528210000_real_marketplace_workflows.sql
supabase/migrations/20260529150000_scale_search_realtime_security.sql
supabase/migrations/20260529170000_beta_trust_operations.sql
supabase/seed.sql (optional local/demo data)
```

The seed file creates beta test users, sellers, buyers, categories, services, orders, messages, reviews, and trust/moderation records. Do not run seed data in production.

Admin login:

- Path: `/admin-login`
- Credentials are managed privately through Supabase Auth.
- Admin access is granted by assigning the `admin` or `moderator` role in the `users` table.

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Verification

```bash
npm run type-check
npm run build
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/marketplace` | Browse services |
| `/marketplace/[category]` | Browse a category |
| `/listing/[id]` | View a service |
| `/login` | Sign in |
| `/admin-login` | Admin sign in |
| `/signup` | Create account |
| `/dashboard/buyer` | Buyer dashboard |
| `/dashboard/buyer/saved` | Saved services |
| `/dashboard/buyer/settings` | Buyer onboarding/settings |
| `/dashboard/seller` | Seller dashboard |
| `/dashboard/messages` | Realtime messaging |
| `/dashboard/payments` | Beta payment workflow and order operations |
| `/dashboard/admin` | Admin finance dashboard |

## Current Limitations

- Payments use a beta payment system and are not connected to a live provider.
- Seller verification is not a complete review workflow yet.
- Service moderation is not complete.
- Reviews are not yet tied to completed orders.
- Search is basic and should be upgraded before catalog growth.
- Public moderation for users, services, reviews, and messages still needs to be built.
- Buyer checkout and order detail pages need more production-grade scope, requirements, cancellation, and dispute handling.

## Documentation

- [APP_FEATURES.md](./APP_FEATURES.md): detailed product feature document.
- [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md): launch audit, risks, and implementation order.
- [LAUNCH_RISKS.md](./LAUNCH_RISKS.md): public-beta risk register.
- [QUICK_START.md](./QUICK_START.md): older quick-start reference.
- [DEPLOYMENT.md](./DEPLOYMENT.md): deployment reference.

## License

MIT
