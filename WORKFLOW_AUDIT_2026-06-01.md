# Kingdom Marketplace Workflow Audit - June 1, 2026

## Scope

Audited the app end to end across account creation, role onboarding, buyer discovery, seller onboarding, service media upload, service review, booking, order lifecycle, messaging, reviews, notifications, admin moderation, and public info/legal pages.

## Workflow Coverage

- Auth: email signup, Google callback, role selection, dashboard routing, and protected dashboard redirects.
- Buyer: marketplace search, listing detail, save/message/book actions, checkout, order detail, delivery acceptance, revision request, cancellation/dispute request, and completed-order review.
- Seller: seller activation, profile update, profile media upload, service draft/save/review submission, listing media upload, service status display, order delivery, and seller dashboard navigation.
- Admin: pending seller verification, pending service review, service approve/pause/reject, review moderation, abuse report handling, disputes, categories, audit logs, and manual beta finance adjustments.
- Messaging: conversation creation from listing, inbox summaries, realtime messages, typing/presence, read state, and attachment upload path.
- Public pages: home, marketplace, listing, about, contact, terms, privacy, and how-it-works.

## Refinements Completed

1. Service media rendering
   - Added shared video detection in `lib/marketplace/media.ts`.
   - Marketplace cards now render uploaded video media as `<video>` instead of `next/image`.
   - Listing detail pages now render service videos with controls.

2. Buyer booking guard
   - Listing actions now block a seller from booking their own service before checkout routing.
   - Existing message guard remains in place for own-service messaging.

3. Order action validation
   - Seller delivery now requires a meaningful delivery message.
   - Buyer revision requests now require revision notes.
   - Cancellation and dispute requests now require a reason before calling server actions.

4. Notification usability
   - Mobile notification panel already opens as a fixed overlay with backdrop and close control.
   - Added Escape-key close support for keyboard and desktop users.

5. Storage setup hardening
   - The media storage migration now creates both `marketplace-media` and `message-attachments` buckets.
   - Message attachments now have upload/read/delete policies aligned with the client upload path.

## Existing Working Paths Confirmed

- Services submitted by sellers enter `pending_review`.
- Admins review pending services in `/dashboard/admin` under the Services tab.
- Approved services become active and are discoverable in marketplace and listing pages.
- Buyers can create accounts, choose buyer role, search services, message sellers, book services, and review completed orders.
- Sellers can create accounts, activate seller workflow, upload media, list services, submit for review, message buyers, and deliver orders.

## Verification

Automated checks run during this audit:

- `npm run lint`
- `npm run build`
- `npm run type-check`
- `git diff --check`

Manual workflow reasoning was performed against the route files, domain actions, Supabase RPC calls, storage policies, and UI components that compose each core buyer/seller/admin flow.

## Deployment Notes

- Apply `supabase/migrations/20260601120000_marketplace_media_storage.sql` before testing profile media, listing media, or message attachments in a fresh Supabase environment.
- Generate fresh database types after applying migrations if the live Supabase schema changes:

```bash
npm run db:types
```
