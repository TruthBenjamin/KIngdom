# Kingdom Marketplace App Features

## Overview

Kingdom Marketplace is a faith-centered service marketplace for Christian creatives, ministries, churches, founders, and mission-led teams. The app helps buyers discover trusted sellers, compare service packages, message creators, book work, manage escrow-backed orders, and track payments.

The product promise is simple: help people find "Kingdom talent" and complete real creative or technical projects with more trust, clarity, and accountability.

## Main Users

### Buyers

Buyers are people or organizations looking for help with creative, ministry, business, media, or technical work. They can browse services, save favorites, message sellers, book orders, confirm simulated payments, request revisions, and approve completed work.

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

- Hero message: "Kingdom talent, trusted solutions."
- Clear buyer and seller calls to action.
- Featured service examples with images, category labels, and starting prices.
- Popular categories such as graphic design, video editing, music production, church media, website development, and writing.
- Marketplace preview showing sample service cards.
- Trust-focused copy for ministry-ready work, clear scope, and relationship-first collaboration.
- Creator spotlight section.

## Marketplace Browse

Route: `/marketplace`

The marketplace page is where buyers search and compare active services from sellers.

Main features:

- Live services loaded from Supabase.
- Search by service title, description, or category.
- Category filtering.
- Price filters for under `$100`, `$100 - $300`, and `$300+`.
- Sorting options for popular, newest, top rated, featured, price low, and price high.
- Service cards showing pricing, category, delivery time, seller details, ratings, and trust signals.
- Empty state when no services match the filters.
- Marketplace quality sidebar explaining profile depth, cleaner decisions, and real workflows.

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
- Trust guidance explaining category fit, seller confidence, and scoped buying.
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
- Requirements section showing what the seller needs from the buyer.
- Recent reviews for the seller.
- Related services based on category and tags.
- Action buttons to book, message, or save the service.

Buyer actions:

- Book the service and create an escrow order.
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
- Pending escrow balance.
- Active orders count.
- Published services count.
- Seller onboarding profile.
- Service creation and editing.
- Service publishing and pausing.
- Recent seller orders.
- Shortcuts to orders, messages, reviews, earnings, and profile.

Seller profile fields:

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

## Realtime Messaging

Route: `/dashboard/messages`

Messaging allows buyers and sellers to discuss scope, orders, files, and deliveries.

Main features:

- Conversation inbox.
- Search conversations.
- Realtime message updates through Supabase Realtime.
- Buyer and seller participant details.
- Message unread counts.
- Read and delivered indicators.
- Typing indicators.
- Online presence and last-seen behavior.
- Text messages.
- Image and file attachments.
- Attachment upload through Supabase Storage.
- Order context displayed inside conversations when available.
- Mobile-friendly inbox and conversation layout.

Supported message types include text, image, file, deliverable, and system-style messages.

## Payments And Escrow

Route: `/dashboard/payments`

The payments dashboard manages the order lifecycle and internal wallet flow. Payments are simulated in the current implementation.

Main features:

- Available wallet balance.
- Pending escrow balance.
- Total order count.
- Order escrow list.
- Recent transactions.
- Withdrawal requests.
- Delivery message defaults.
- Revision message defaults.
- Realtime refresh for wallets, orders, transactions, and withdrawals.

Buyer escrow actions:

- Confirm simulated payment.
- Accept delivered work.
- Request a revision.

Seller escrow actions:

- Deliver work.
- Request withdrawal.

Order lifecycle:

1. Buyer books a service.
2. App creates an order in pending payment state.
3. Buyer confirms simulated payment.
4. Order becomes active and funds are held in escrow.
5. Seller delivers work.
6. Buyer accepts delivery or requests revision.
7. Accepted delivery releases seller earnings and records platform revenue.
8. Seller can request withdrawal from available balance.

## Admin Finance

Route: `/dashboard/admin`

The admin dashboard is restricted to users with the admin role.

Main features:

- Platform revenue summary.
- Total orders count.
- Pending withdrawals count.
- Dispute count.
- All orders table with buyer, seller, amount, escrow fee, and status.
- Recent transactions.
- Withdrawal approval workflow.

Admin actions:

- Approve withdrawal.
- Mark withdrawal as paid.
- Reject withdrawal with a note.

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
- `users`: app-level user profile data and role.
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
- `typing_status`: realtime typing state.
- `user_presence`: online and last-seen state.
- `orders`: escrow-backed order records.
- `wallets`: user balances.
- `transactions`: wallet and escrow transaction history.
- `withdrawals`: seller withdrawal requests.
- `platform_revenue`: platform fee tracking.

## Seed Data

The realistic seed file creates a useful demo marketplace.

Demo sellers:

- Mara Ellington: brand design.
- Jonah Reeves: video production.
- Selah Brooks: worship audio.
- Gideon Park: web development.

Demo buyer:

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
- Realtime updates are handled through Supabase Realtime.
- File attachments use the `message-attachments` Supabase Storage bucket.
- Escrow actions are implemented as Next.js server actions that call Supabase RPC functions.
- Payments are simulated through the local payment gateway abstraction, not a live external payment provider.
- Row-level security is expected to protect private user data.
- The app has separate Supabase upgrade SQL files for messaging, escrow, marketplace architecture, and realistic demo data.

## Route Map

| Route | Purpose |
| --- | --- |
| `/` | Home page and marketplace introduction |
| `/marketplace` | Browse all active services |
| `/marketplace/[category]` | Browse services in one category |
| `/listing/[id]` | View one service and take buyer actions |
| `/login` | Sign in |
| `/signup` | Create account |
| `/auth/callback` | OAuth callback |
| `/dashboard/buyer` | Buyer dashboard |
| `/dashboard/buyer/saved` | Saved services |
| `/dashboard/buyer/settings` | Buyer profile and preferences |
| `/dashboard/seller` | Seller profile, services, and order summary |
| `/dashboard/messages` | Realtime buyer-seller messaging |
| `/dashboard/payments` | Wallet, escrow orders, transactions, and withdrawals |
| `/dashboard/admin` | Admin finance dashboard |
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
- Admin finance tools create accountability around withdrawals and revenue.
- Seed data makes demos and testing realistic.

## Suggested Next Improvements

High-impact next steps:

- Add real payment provider integration.
- Add a complete order detail page.
- Add dispute resolution screens.
- Add seller portfolio media management.
- Add stronger service creation validation.
- Add admin moderation for users, services, reviews, and conversations.
- Add notification emails for messages, payments, and delivery updates.
- Add image upload for service media instead of requiring a URL.
- Add review submission after completed orders.
- Add analytics for sellers and admins.
- Add tests for escrow server actions and marketplace search.

