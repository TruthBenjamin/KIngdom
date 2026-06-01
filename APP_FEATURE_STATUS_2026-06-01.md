# Kingdom Marketplace Feature Status - 2026-06-01

This document summarizes the current app features and separates what is implemented and working from what is broken, incomplete, or still a beta placeholder.

## Working Features

### Public Site

- Home page at `/` with marketplace positioning, category prompts, featured service previews, seller conversion content, and trust messaging.
- Static information pages: `/about`, `/how-it-works`, `/contact`, `/terms`, and `/privacy`.
- Responsive shared header and footer.

### Authentication And Accounts

- Email login and signup through Supabase Auth.
- Google OAuth callback route at `/auth/callback`.
- Role-aware user records in `users`.
- Buyer, seller, and admin role handling.
- Protected dashboard pages redirect unauthenticated users to login.
- Profile photo upload from buyer settings and seller profile settings.

### Marketplace Discovery

- Marketplace browse page at `/marketplace`.
- Category pages at `/marketplace/[category]`.
- Listing detail page at `/listing/[id]`.
- Active service loading from Supabase.
- Search, category filters, price filters, sorting, and paginated result pages.
- Service cards with seller details, price, category, delivery, rating, and trust badges.
- Related services on listing pages.

### Buyer Tools

- Buyer dashboard at `/dashboard/buyer`.
- Saved services page at `/dashboard/buyer/saved`.
- Buyer settings page at `/dashboard/buyer/settings`.
- Buyer dashboard review queue for completed orders that still need feedback.
- Buyer settings profile photo upload.
- Save and unsave services.
- Buyer profile fields for organization, buyer type, project interests, and default project brief.
- Buyer dashboard summary for saved services, active chats, completed orders, and total spend.

### Seller Tools

- Seller dashboard at `/dashboard/seller`.
- Seller account activation.
- Seller profile editing for headline, location, response time, availability, specializations, and portfolio URLs.
- Seller profile image upload.
- Service creation and editing.
- Service publishing and pausing.
- Seller service moderation status visibility.
- Seller service pipeline summary for live, review, draft/paused, and rejected services.
- Safer seller media uploads with profile/service file type and size validation.
- Recent seller orders and seller metrics.

### Messaging And Inbox

- Messages page at `/dashboard/messages`.
- Conversation inbox loaded through `get_inbox_summaries`.
- Realtime message updates for sender and receiver.
- Conversation search.
- Text messages.
- Image and file attachment upload through Supabase Storage.
- Typing indicators.
- Online presence and last-seen display.
- Read receipts and delivery ticks.
- Conversation unread counts.
- Order context in conversation header when available.
- Clickable message participant profiles through `/profile/[id]`.
- Inbox notifications for new messages through `create_inbox_message_notification`.
- Notification center message links open the matching conversation with `?conversation=`.

### Profiles

- Auth-aware profile page at `/profile/[id]`.
- Shareable seller profile URLs at `/u/[username]` backed by persistent usernames and profile visibility state.
- Profile page displays user name, avatar/photo, role, bio, rating, verification, response time, location/context, specialties, active seller services, and recent reviews where data is available.
- Conversation participants can be opened from the message header and incoming message avatars.
- Seller profile pages include Contact Seller, Message Seller, Request Service, and copy profile link actions.
- Seller dashboard includes public profile username and visibility controls.
- Public seller profiles show related creators from matching active service categories.

### Orders And Beta Payments

- Checkout route at `/checkout/[serviceId]`.
- Order creation from service checkout.
- Payments dashboard at `/dashboard/payments`.
- Order lifecycle states for pending payment, active, delivered, revision requested, completed, cancelled, and disputed.
- Beta payment confirmation.
- Seller delivery workflow.
- Buyer revision request and delivery acceptance.
- Wallet balances for available and pending funds.
- Transaction history.
- Withdrawal request flow.
- Platform revenue records for beta escrow fee tracking.
- Order detail page at `/dashboard/orders/[id]`.
- Order documents table, storage policies, upload RPC, and admin review RPC.

### Notifications

- Header notification center.
- Realtime notification subscription.
- Notification unread badge.
- Mark one notification read.
- Mark all notifications read.
- Notifications for order delivery, revision requests, payment confirmation, moderation actions, seller verification, abuse reports, system alerts, and new inbox messages where the corresponding database functions are used.

### Admin And Trust Operations

- Admin login route at `/admin-login`.
- Admin dashboard at `/dashboard/admin`.
- Admin checks based on user role and fallback admin email.
- User moderation: warn, restrict, ban, and risk score.
- Seller verification approval/rejection.
- Service moderation approval, rejection, pause, archive, and takedown notes.
- Review moderation publish, hide, and flag.
- Abuse report submission and admin resolution.
- Manual adjustment placeholders for finance operations.
- Category management.
- Admin audit logs.
- Suspicious activity records for rate limits and abuse review.

### Database, Security, And Infrastructure

- Canonical Supabase schema for fresh installs.
- Migration path for marketplace, workflows, realtime messaging, trust operations, media storage, admin repair, order documents, and inbox notifications.
- Seller service save/publish RPCs are hardened against legacy text-vs-enum role and service status mismatches.
- Row-level security enabled across app tables.
- Scoped policies for marketplace, messaging, orders, payments, notifications, and admin operations.
- RPC-backed mutations for sensitive workflows.
- Supabase Realtime channels for messages, conversations, presence, typing, notifications, wallets, orders, transactions, and withdrawals.
- Supabase Storage buckets/policies for marketplace media, message attachments, and order documents.

## Broken Or Incomplete Features

### Live Payments

- Real payment provider integration is not implemented.
- Current payment flow is a beta/manual confirmation workflow.
- Withdrawals are recorded inside the app but are not paid through a bank or payment provider automatically.
- Refunds, credits, debits, and fee corrections are manual adjustment placeholders.

### Email And External Notifications

- Email notifications are not implemented.
- SMS, push, and webhook notifications are not implemented.
- Notification delivery is in-app only.

### Public Profile Privacy And Sharing

- `/profile/[id]` and `/u/[username]` support seller public identity with profile visibility settings.
- Sellers with active services can be public under marketplace visibility, and sellers can copy/share their profile URL from profile and dashboard.
- Profile discovery includes category-based related creators connected to real active services and seller profile data.

### Disputes And Refund Resolution

- Dispute state and admin review data exist, but a full dispute resolution screen and provider-backed refund flow are not complete.
- Admin manual adjustments record intent but do not move money through an external provider.

### Reviews

- Review tables and moderation exist.
- Listing and profile pages can show published reviews.
- A complete buyer-facing review submission screen after order completion still needs a polished end-to-end UI.

### Service Media Management

- Marketplace media storage exists.
- Seller profile image upload exists.
- Service creation includes direct image/video upload for primary listing media, but a complete polished multi-media service gallery manager is not finished.

### Search And Recommendations

- Marketplace search and category filtering work.
- Personalized recommendations, saved-search alerts, and advanced ranking analytics are not implemented.

### Admin Depth

- Admin operations are functional for beta workflows.
- Advanced audit filtering, staff permissions beyond admin checks, SLA queues, and full moderation evidence review are not complete.

### Analytics

- Seller analytics are implemented as operational summaries and service pipeline counts, but not full trend analytics.
- Admin analytics are limited to operational summaries.
- Buyer analytics and recommendation history are not implemented.

### Tests And QA Automation

- TypeScript type-check and production build pass.
- Dedicated automated tests for marketplace search, messaging RPCs, notifications, payment workflows, and admin moderation are not yet present.
- End-to-end browser tests are not currently in the repo.

### Production Hardening

- Error reporting, observability dashboards, provider webhooks, advanced rate limits, and backup/restore runbooks need more production hardening.
- Some database repair migrations exist because auth/admin setup needed manual recovery in this beta environment.

## Current Route Map

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | Working | Public home page |
| `/marketplace` | Working | Browse services |
| `/marketplace/[category]` | Working | Browse one category |
| `/listing/[id]` | Working | Service detail and buyer actions |
| `/profile/[id]` | Working with RLS limits | User profile reached from messages |
| `/login` | Working | Sign in |
| `/signup` | Working | Create account |
| `/auth/callback` | Working | OAuth callback |
| `/dashboard/buyer` | Working | Buyer overview |
| `/dashboard/buyer/saved` | Working | Saved services |
| `/dashboard/buyer/settings` | Working | Buyer profile settings |
| `/dashboard/seller` | Working | Seller profile and services |
| `/dashboard/messages` | Working | Realtime messaging and inbox |
| `/dashboard/payments` | Beta working | Manual beta payment and order workflow |
| `/dashboard/orders/[id]` | Working | Order details and documents |
| `/dashboard/admin` | Beta working | Admin operations |
| `/admin-login` | Working | Admin login |
| `/about` | Working | Static information |
| `/how-it-works` | Working | Static information |
| `/contact` | Working | Static information |
| `/terms` | Working | Legal page |
| `/privacy` | Working | Legal page |

## Verification Snapshot

- `npm run type-check` was run successfully after the latest dashboard/profile updates.
- `npm run build` was run successfully after the latest dashboard/profile updates.
- This status document is based on current code structure, migrations, and visible app routes as of 2026-06-01.
