# Kingdom Marketplace App Features

## Overview

Kingdom Marketplace is a faith-centered service marketplace for Christian creatives, ministries, churches, founders, and mission-led teams. The app helps buyers discover sellers, compare service packages, message creators, book work, manage protected marketplace workflows, and track marketplace activity.

## Main Users

### Buyers

Buyers are people or organizations looking for help with creative, ministry, business, media, or technical work. They can browse services, save favorites, message sellers, book orders, confirm beta payments, request revisions, and approve completed work.

Common buyer examples:

- Churches looking for sermon graphics, websites, event support, or media help.
- Ministries needing launch assets, donor copy, audio cleanup, or video editing.
- Faith-led businesses looking for design, web, writing, or creative support.
- Individuals looking for trusted Christian creators.

### Sellers

Sellers are creatives, freelancers, builders, and professionals who publish services and accept orders. They can create a seller profile, publish service packages, manage active services, receive messages, deliver work, and request withdrawals.

Common seller examples:

- Brand designers.
- Video editors.
- Worship audio engineers.
- Web developers.
- Writers and strategists.
- Event support specialists.

### Admins

Admins manage financial oversight. The current admin dashboard focuses on orders, transactions, withdrawals, disputes, and platform revenue.

## Core App Areas

## Home Page

Route: `/`

The home page introduces the marketplace and pushes users toward two main actions: hiring a creator or becoming a seller.

Important elements:

- Hero message: "Kingdom Marketplace"
- Compact marketplace header search and navigation modeled after a service discovery product.
- Clear buyer and seller calls to action.
- Generated photorealistic creator collage stored at `public/images/kingdom-creator-collage.png`.
- Popular services panel for graphic design, video editing, music production, website development, church media, and writing.
- Category tile strip for fast browsing.
- Featured service cards with creator labels, ratings, review counts, prices, and saved-heart affordances.
- Seller conversion panel and top creators sidebar.
- Trust strip for faith-centered community, quality, secure transactions, and support.
- Organization trust line for ministry and nonprofit credibility.

## Marketplace Browse

Route: `/marketplace`

The marketplace page is where buyers search and compare active services from sellers.

Main features:

- Live services loaded from Supabase.
- Full-text service search through the `marketplace_search_services` RPC.
- Relevance ranking that combines text match, category fit, seller rating/review count, seller profile quality, verification status, response time, featured state, and recency.
- Category filtering.
- Price filters for under `$100`, `$100 - $300`, and `$300+`.
- Stable sorting options for popular, newest, top rated, featured, price low, and price high.
- Paginated result sets for larger catalogs.
- Service cards showing pricing, category, delivery time, seller details, ratings, and comparison signals.
- Empty state when no services match the filters.

The marketplace only shows services that are active and marked as published.

## Category Pages

Route: `/marketplace/[category]`

Each category has a dedicated page for focused browsing.

Main features:

- Category name, icon, and description.
- Services filtered to that category.
- Category-specific sorting.
- Price shortcuts.
- Featured sellers for the category.
- Empty state for categories with no published services.

Seeded categories include:

- Brand Design
- Video Production
- Worship Audio
- Web Development
- Writing Strategy
- Event Support

## Listing Detail Page

Route: `/listing/[id]`

The listing page gives buyers the full details for a specific service.

Main features:

- Large service image.
- Service category, title, description, price, delivery time, and revision count.
- Seller rating and review count.
- Seller profile preview with name, avatar, headline, response time, and trust status.
- Seller name links to the seller's public profile URL when a profile username exists.
- Requirements section showing what the seller needs from the buyer.
- Recent reviews for the seller.
- Related services based on category and tags.
- Action buttons to book, message, or save the service.

Buyer actions:

- Book the service and create a protected marketplace workflow.
- Message the creator before booking.
- Save or remove the service from saved services.

## Authentication

Routes:

- `/login`
- `/signup`
- `/auth/callback`

Authentication is powered by Supabase Auth.

Important capabilities:

- Email login and signup.
- Google OAuth callback route.
- Role-aware accounts for buyers, sellers, and admins.
- Protected dashboard pages that redirect unauthenticated users to login.
- User profile records stored in Supabase tables.

## Buyer Dashboard

Route: `/dashboard/buyer`

The buyer dashboard summarizes the buyer's marketplace activity.

Main features:

- Saved services count.
- Active chats count.
- Completed orders count.
- Total spent across active, delivered, and completed orders.
- Shortcuts to saved services, conversations, settings, and payments.
- Recent saved services loaded from the buyer's account.
- Link back to the marketplace.
- Profile completion prompt.

## Saved Services

Route: `/dashboard/buyer/saved`

Saved services let buyers build a shortlist.

Main features:

- Shows every service saved by the current buyer.
- Links each saved service back to its listing page.
- Shows service title, category, seller name, and price.
- Allows buyers to remove a service from saved.
- Empty state when nothing has been saved yet.

## Buyer Settings

Route: `/dashboard/buyer/settings`

Buyer settings store profile and onboarding details that help sellers understand buyer needs.

Main features:

- Display name.
- Email display.
- Organization name.
- Buyer type: individual, church, ministry, or business.
- Project interests.
- Default project brief.
- Notification toggles for project updates and new messages.
- Verification status.
- Profile completion score.

## Seller Dashboard

Route: `/dashboard/seller`

The seller dashboard is the seller's operating area.

Main features:

- Seller account activation for users who are not yet sellers.
- Available earnings.
- Pending beta payment balance.
- Active orders count.
- Published services count.
- Seller onboarding profile.
- Public profile username and visibility controls.
- Copyable public seller profile link.
- Service creation and editing.
- Service publishing and pausing.
- Recent seller orders.
- Shortcuts to orders, messages, reviews, earnings, and profile.

Seller profile fields:

- Public username.
- Profile visibility: private, marketplace, or public.
- Headline.
- Location.
- Response time in minutes.
- Verification status.
- Accepting orders toggle.
- Profile completion score.

Service fields:

- Title.
- Description.
- Category.
- Price.
- Delivery days.
- Revision count.
- Media URL.
- Tags.
- Buyer requirements.
- Active or paused status.

## Public Profiles

Routes:

- `/profile/[id]`
- `/u/[username]`

Public profiles give sellers a shareable identity outside a single listing or conversation.

Main features:

- Persistent seller usernames stored on `users.username`.
- Shareable seller profile URLs such as `/u/grace-media`.
- Profile visibility state stored on `users.profile_visibility`.
- Public profile lookup backed by Supabase rather than static or placeholder pages.
- Profile pages show real user, seller profile, active service, and review data where available.
- Sellers with active marketplace services can be visible under marketplace visibility.
- Sellers can copy their profile link from the profile page and seller dashboard.
- Seller profile CTA actions connect to the existing messaging workflow and featured service links.
- Related creators are loaded from other sellers with active services in matching categories.

## Realtime Messaging

Route: `/dashboard/messages`

Messaging allows buyers and sellers to discuss scope, orders, files, and deliveries.

Main features:

- Conversation inbox loaded through a scoped `get_inbox_summaries` RPC.
- Search conversations.
- Realtime message updates through per-user Supabase Realtime subscriptions.
- Buyer and seller participant details.
- Message unread counts calculated by the inbox RPC.
- Read and delivered indicators.
- Typing indicators scoped to the active conversation.
- Online presence and last-seen behavior scoped to the active participant.
- Text messages.
- Image and file attachments.
- Attachment upload through Supabase Storage.
- Order context displayed inside conversations when available.
- Mobile-friendly inbox and conversation layout.

Supported message types include text, image, file, deliverable, and system-style messages.

## Payments And Escrow

Route: `/dashboard/payments`

The payments dashboard manages the order lifecycle and beta payment flow. Payments are not connected to a live payment provider yet.

Main features:

- Available wallet balance.
- Pending beta payment balance.
- Total order count.
- Protected workflow list.
- Recent transactions.
- Withdrawal requests.
- Delivery message defaults.
- Revision message defaults.
- Realtime refresh for wallets, orders, transactions, and withdrawals.

Buyer beta-payment actions:

- Confirm beta payment.
- Accept delivered work.
- Request a revision.

Seller protected-workflow actions:

- Deliver work.
- Request withdrawal.

Order lifecycle:

1. Buyer books a service.
2. App creates an order in pending payment state.
3. Buyer confirms beta payment.
4. Order becomes active and seller earnings move into pending beta balance.
5. Seller delivers work.
6. Buyer accepts delivery or requests revision.
7. Accepted delivery releases seller earnings and records platform revenue.
8. Seller can request withdrawal from available balance.

## Admin Operations

Route: `/dashboard/admin`

The admin dashboard is restricted to users with the admin role.

Admin access:

- Login path: `/admin-login`
- Email: `thefreelance35@gmail.com`
- Password: configured with `NEXT_PUBLIC_ADMIN_PASSWORD`

Main features:

- Operational overview for pending sellers, pending services, open reports, and disputes.
- User moderation with warning, restriction, ban, and risk score support.
- Seller verification approval and rejection queue.
- Service moderation for approval, pause, rejection, archive, and takedown notes.
- Review moderation for publish, flag, and hide decisions.
- Abuse report queue for users, services, reviews, messages, orders, and accounts.
- Dispute review and refund/manual adjustment placeholders.
- Category management.
- Admin audit log history.

Admin actions:

- Approve or reject sellers.
- Moderate users, services, and reviews.
- Resolve or dismiss abuse reports.
- Record manual adjustment placeholders until live provider finance exists.
- Update marketplace categories.

## Public Information Pages

The app includes static informational pages:

- `/about`
- `/how-it-works`
- `/contact`
- `/terms`
- `/privacy`

These pages support trust, onboarding, legal clarity, and basic communication.

## Database And Data Model

The app uses Supabase for authentication, relational data, row-level security, realtime updates, and storage.

Important tables include:

- `auth.users`: Supabase authentication users.
- `users`: app-level user profile data, role, username, and public profile visibility.
- `profiles`: general profile data, seller flag, ratings, and review counts.
- `seller_profiles`: seller-specific profile, verification, response time, and availability.
- `buyer_profiles`: buyer-specific organization details, interests, and project brief.
- `categories`: marketplace categories.
- `listings`: legacy or base listing records.
- `services`: modern marketplace service packages used for search and booking.
- `saved_services`: buyer saved services.
- `reviews`: buyer feedback for sellers and listings.
- `conversations`: buyer-seller message threads.
- `messages`: individual messages and attachments.
- `message_reads`: read tracking.
- `typing_status`: active-conversation realtime typing state.
- `user_presence`: scoped online and last-seen state.
- `orders`: trackable marketplace order records.
- `wallets`: user balances.
- `transactions`: wallet and beta payment transaction history.
- `withdrawals`: seller withdrawal requests.
- `platform_revenue`: platform fee tracking.
- `notifications`: message, order, moderation, verification, and system notifications.
- `abuse_reports`: user-submitted reports for services, reviews, messages, orders, and accounts.
- `admin_audit_logs`: admin moderation, verification, category, and adjustment actions.
- `suspicious_activities`: rate-limit and abuse-prevention signals.
- `manual_adjustments`: refund, credit, debit, and fee-correction placeholders until live provider finance exists.

Recent profile identity database additions:

- `users.username`: unique seller/admin profile slug used by `/u/[username]`.
- `users.profile_visibility`: controls private, marketplace, or public profile exposure.
- `update_public_profile_identity`: authenticated RPC for sellers to update username and visibility.
- `generate_unique_profile_username`: helper RPC/function for collision-safe usernames.

## Seed Data

The realistic seed file creates a useful beta marketplace data.

Beta test sellers:

- Mara Ellington: brand design.
- Jonah Reeves: video production.
- Selah Brooks: worship audio.
- Gideon Park: web development.

Beta test buyer:

- Grace Harbor Church.

Seeded services include:

- Church launch brand identity.
- Sermon series campaign kit.
- Testimony video edit.
- Conference recap reels.
- Worship single mix and master.
- Podcast cleanup and leveling.
- Premium church website build.
- Event registration and payment workflow.

The seed data also includes categories, seller profiles, buyer profile data, reviews, and saved services.

## Technical Stack

Current package configuration:

- Next.js 14.
- React 18.
- TypeScript.
- Tailwind CSS.
- Supabase JavaScript SDK.
- Supabase SSR helpers.
- Lucide React icons.
- React Hot Toast.
- Zustand.
- Zod and React Hook Form are available for forms and validation.

## Important Implementation Notes

- The app uses the Next.js App Router.
- Most public marketplace data is loaded with server components and Supabase server clients.
- Interactive dashboards and messaging use client components.
- Marketplace search is handled by indexed database RPCs instead of in-memory sorting.
- Realtime updates are handled through scoped Supabase Realtime subscriptions.
- File attachments use the `message-attachments` Supabase Storage bucket.
- Message sending, inbox summaries, read marking, and escrow actions are implemented through validated Supabase RPC functions or server actions.
- Payments use a local beta payment abstraction, not a live external payment provider.
- Row-level security and scoped RPCs protect private user data.
- The app has separate Supabase upgrade SQL files for messaging, payment workflow, marketplace architecture, and realistic beta data.

## Route Map

| Route | Purpose |
| --- | --- |
| `/` | Home page and marketplace introduction |
| `/marketplace` | Browse all active services |
| `/marketplace/[category]` | Browse services in one category |
| `/listing/[id]` | View one service and take buyer actions |
| `/profile/[id]` | Auth-aware user profile page with real services, reviews, and seller CTAs |
| `/u/[username]` | Shareable seller public profile URL |
| `/login` | Sign in |
| `/signup` | Create account |
| `/auth/callback` | OAuth callback |
| `/dashboard/buyer` | Buyer dashboard |
| `/dashboard/buyer/saved` | Saved services |
| `/dashboard/buyer/settings` | Buyer profile and preferences |
| `/dashboard/seller` | Seller profile, services, and order summary |
| `/dashboard/messages` | Realtime buyer-seller messaging |
| `/dashboard/payments` | Beta payment workflow, orders, transactions, and withdrawals |
| `/dashboard/admin` | Admin operations, moderation, verification, disputes, categories, and audit logs |
| `/about` | About page |
| `/how-it-works` | User education page |
| `/contact` | Contact page |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

## What Makes The App Important

Kingdom Marketplace is not only a service listing site. It is designed around trust and real project completion.

Important product strengths:

- Buyers can evaluate sellers before spending money.
- Sellers can publish clear services with price, delivery, revisions, and requirements.
- Messaging supports scope clarification before and during orders.
- Escrow flow gives both sides a clearer path from booking to delivery.
- Dashboards keep buyer and seller activity organized.
- Admin operations tools create accountability around moderation, verification, disputes, and beta finance placeholders.
- Seed data makes beta testing realistic.

## Suggested Next Improvements

High-impact next steps:

- Add real payment provider integration.
- Add dispute resolution screens.
- Add seller portfolio media management.
- Add stronger service creation validation.
- Add notification emails for messages, payments, and delivery updates.
- Add image upload for service media instead of requiring a URL.
- Add review submission after completed orders.
- Add analytics for sellers and admins.
- Add tests for payment workflow server actions and marketplace search.
