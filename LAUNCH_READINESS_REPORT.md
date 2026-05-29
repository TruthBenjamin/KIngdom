# Kingdom Marketplace Launch Readiness Report

Date: May 29, 2026

## Final QA Report

Status: stronger controlled beta candidate after the May 29 systems pass. The app is still not ready for broad public launch because payments are simulated, browser automation is not complete, and production observability/RLS test coverage are not yet in place.

Verified locally:

- Static review of all primary user surfaces: homepage, marketplace, listing cards, auth, role onboarding, buyer dashboard, seller dashboard, payments/orders, and admin operations.
- Customer-facing trust language now avoids real escrow claims where the system is still a beta workflow.
- Spinner-only waits were replaced with layout-preserving skeletons on buyer, seller, and payments dashboards.
- Login and signup copy, casing, disabled states, and password placeholder encoding were cleaned up.
- Buyer dashboard internal table-name copy was replaced with product language.
- Seller dashboard internal implementation copy was replaced with buyer/seller-facing workflow language.
- Payment dashboard empty state now gives a clear next action and labels the fee as a platform fee.
- Auth sessions now have a verified path to persisted `public.users` rows through `ensure_current_user_profile()`.
- Role onboarding and seller workflow mutations now route through server actions/RPCs instead of broad client writes.
- Seller service visibility now respects moderation state; pending-review services cannot be self-published by sellers.
- Canonical schema fresh-install blockers, missing `orders.status`, and missing runtime tables were fixed.
- Seed data is deterministic for core beta orders, conversations, reviews, and trust records.

Command verification:

- Passed: `npm run type-check`
- Passed: `npm run build`
- Limited: local dev-server route smoke testing previously started, but multi-route HTTP checks timed out after cold compilation in this shell. A single `/login` request returned `200 OK`; full browser automation remains required before widening beta.

## Launch Checklist

- [x] Use `LAUNCH_AUDIT.md` as the risk register and launch checklist.
- [x] Remove or soften trust claims that outrun current payment infrastructure.
- [x] Improve dashboard loading states with skeletons.
- [x] Remove visible implementation details from user-facing empty/helper copy.
- [x] Improve auth role routing clarity and form polish.
- [x] Add concrete beta readiness documentation.
- [x] Add real systems audit documentation.
- [x] Add persisted app-user creation from authenticated sessions.
- [x] Move seller activation/profile/service mutations behind server action/RPC boundaries.
- [ ] Connect a real payment provider with webhook validation.
- [ ] Move remaining buyer settings and support workflows behind narrow server actions/RPC.
- [ ] Complete order-based review integrity.
- [ ] Add production observability, rate limits, and abuse controls.
- [ ] Add automated Playwright coverage for buyer, seller, admin, auth, checkout, messaging, and payments.

## Performance Checklist

- [x] Marketplace has database-backed pagination and stable page controls.
- [x] Remote image allowlist exists in Next config.
- [x] Dashboard loading states reserve layout and reduce perceived jank.
- [x] Header session lookup is scoped to client hydration and role-aware links.
- [ ] Add dashboard pagination for orders, services, withdrawals, and transactions.
- [ ] Split large dashboard client components where bundle analysis shows avoidable cost.
- [ ] Add query-level RPC summaries for buyer/seller dashboard metrics.
- [ ] Replace generic remote marketplace images with optimized owned assets.
- [ ] Run bundle analyzer before public beta.

## Unresolved Debt

- Payments are still beta/simulated and must not be marketed as real escrow.
- `services` and legacy `listings` concepts still need final consolidation.
- Buyer profile settings still allow important client-side writes.
- Reviews need completed-order enforcement as the source of trust.
- Admin operations exist, but public abuse moderation needs more QA and policy hardening.
- Messaging has richer realtime behavior, but needs load testing under concurrent users.
- Production monitoring, alerting, and rate limiting remain launch blockers.

## Beta Deployment Recommendations

- Launch only as a closed beta with invited buyers and sellers.
- Label payment behavior as beta/manual until provider webhooks and ledger reconciliation are live.
- Seed realistic seller profiles and services, then onboard sellers manually through admin review.
- Require support/admin presence during the first beta transactions.
- Capture beta feedback by workflow: discovery, checkout, messaging, delivery, revision, completion, review.
- Block paid acquisition until payment, moderation, review integrity, and observability are production-grade.
