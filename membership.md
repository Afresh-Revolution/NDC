# CURSOR MASTER PROMPT — REAL NDC MEMBERSHIP & SUBSCRIPTION SYSTEM

## PROJECT CONTEXT

You are working inside the existing Real NDC (Northside Developers Cooperative) codebase.

Your assignment is to inspect, architect, and implement a production-ready membership billing and subscription management system.

**IMPORTANT: Do not immediately begin writing code.**

First, inspect the existing application architecture, authentication flow, database schema, user roles, payment infrastructure, member dashboard, administrative dashboard, and existing membership features.

Reuse the project's established technologies, conventions, components, database patterns, and security architecture.

Do not unnecessarily rebuild existing functionality or introduce conflicting systems.

## 1. MEMBERSHIP STRUCTURE

Implement two membership categories:

### A. Professional Membership

Monthly:
- ₦2,500 per month.
- ₦30,000 for 12 months if continuously paid monthly.

Yearly:
- ₦25,000 per year.
- Annual discount of ₦5,000 compared to 12 monthly payments.

Both billing options provide equivalent Professional Membership privileges.

### B. Associate / Student Membership

Monthly:
- ₦1,000 per month.

Yearly:
- ₦10,000 per year.

Associate members receive community, mentorship, learning resources, and other explicitly authorised benefits.

They do not automatically receive voting privileges, cooperative borrowing rights, or access to project funding.

Membership privileges must be controlled through server-authorised permissions rather than frontend conditions alone.

## 2. ONE-TIME REGISTRATION

Introduce a one-time registration fee of ₦5,000 for new Professional members.

Do not charge returning members a new registration fee when renewing.

The registration fee should be tracked independently from recurring subscriptions and must never be mistaken for a savings contribution.

Make registration fees configurable through administrative settings.

Preserve any existing verified memberships and payment records during migration.

## 3. SUBSCRIPTION BILLING AND ARREARS

Implement a subscription system that automatically generates membership invoices at each billing cycle.

### Monthly billing example

Monthly membership costs ₦2,500.

- January: ₦2,500 due.
- January unpaid.
- February: ₦5,000 outstanding, representing January and February.
- February unpaid.
- March: ₦7,500 outstanding.
- March unpaid.
- April: ₦10,000 outstanding.

This calculation must continue as long as unpaid billing cycles exist.

**Do not multiply the most recent outstanding balance by two every month.**

The correct formula is:

Total outstanding = Sum of all unpaid subscription invoices.

For a fixed monthly rate:

Total outstanding = Unpaid months × ₦2,500.

### Yearly billing example

Annual membership costs ₦25,000.

- 2026: ₦25,000 due.
- 2026 unpaid.
- 2027: ₦50,000 outstanding.
- 2027 unpaid.
- 2028: ₦75,000 outstanding.

Each new annual cycle adds one annual membership invoice.

Do not compound arrears or add interest.

### Student membership

Apply identical accumulation logic using the Associate/Student rates:

- Monthly: ₦1,000 per unpaid cycle.
- Yearly: ₦10,000 per unpaid cycle.

### Critical billing rules

1. Never create duplicate invoices for a billing period.
2. Keep each billing period's invoice separately recorded.
3. Display arrears and the current cycle's invoice independently.
4. Never treat an unpaid invoice as settled.
5. Support partial payments only if the existing payment and accounting architecture can safely reconcile them.
6. Allocate payments to the oldest outstanding invoices first.
7. Never silently erase arrears when a member changes billing frequency.
8. Changes to configured pricing must not retroactively modify historical invoices.
9. Do not impose any additional late-payment penalty.
10. Generate invoices based on established membership billing dates, not on unpredictable login times.

## 4. BILLING PERIODS AND RENEWALS

Every member should have:

- Membership category.
- Billing frequency.
- Subscription start date.
- Current billing period start.
- Current billing period end.
- Next payment due date.
- Current recurring fee.
- Outstanding arrears.
- Total outstanding balance.
- Last verified payment date.
- Membership status.
- Registration payment status.

Use date-safe billing logic.

Handle months with different lengths, leap years, timezone boundaries, and annual anniversaries correctly.

Store timestamps consistently and display them in the appropriate Nigerian timezone.

## 5. MEMBERSHIP STATUS

Implement the following membership statuses:

- Pending Registration
- Active
- Payment Due
- Overdue
- Suspended
- Cancelled

### Status behaviour

**Active:** All currently required membership fees are settled.

**Payment Due:** A new billing invoice exists but has not passed its due date.

**Overdue:** The payment due date has passed with an outstanding balance.

**Suspended:** Membership privileges have been restricted under the configured suspension policy.

**Cancelled:** Membership has been formally terminated, and no new recurring invoices are generated after the cancellation effective date.

Implement a configurable grace period with a proposed default of seven days.

Do not automatically cancel membership when payment is missed.

After the grace period, overdue members should have access to their accounts, billing history, outstanding invoices, payment functionality, and support services.

Restrict only benefits explicitly covered by the membership policy.

Do not automatically continue creating future invoices after a member's valid cancellation or approved termination.

## 6. MEMBER DASHBOARD

Introduce or improve the membership section in the existing dashboard.

Display:

- Current membership category.
- Monthly or yearly billing.
- Membership status.
- Subscription renewal date.
- Current payment due.
- Previous unpaid invoices.
- Total outstanding arrears.
- Full amount required to become current.
- Membership history.
- Downloadable payment receipts.
- Membership privileges.
- Available billing plan changes.

Provide prominent actions:

- Pay Membership
- View Payment History
- Download Receipt
- Change Billing Frequency
- Request Membership Cancellation

### Outstanding payment display

Example:

Professional Membership — Monthly

Current month: ₦2,500

Unpaid previous months: ₦5,000

**Total outstanding: ₦7,500**

Make the breakdown easy to understand.

## 7. PAYMENT INTEGRATION

Inspect the payment integration already used by Real NDC.

If Paystack is already integrated, reuse it rather than creating a duplicate integration.

Implement:

- Secure server-side payment initialization.
- Verified transaction references.
- Server-side amount validation.
- Payment webhook processing.
- Signature verification.
- Idempotent payment handling.
- Invoice settlement.
- Payment failure handling.
- Secure receipt generation.
- Payment reconciliation.

Never trust frontend payment success alone.

Never expose provider secret keys to the browser.

A successful payment must be independently verified before marking invoices as paid.

Ensure duplicate gateway callbacks do not create duplicate financial records.

## 8. MONTHLY AND YEARLY PLAN CHANGES

Allow eligible members to switch between monthly and yearly billing.

However, implement safeguards:

- Existing arrears must remain payable.
- Historical invoices must remain unchanged.
- The new billing frequency should ordinarily become effective after the current billing period.
- Do not charge overlapping monthly and yearly subscriptions.
- Display the effective date before confirmation.
- Do not silently forgive unpaid obligations.

Do not implement automatic prorating without an explicitly approved business policy.

## 9. ADMINISTRATIVE CONTROLS

Introduce an administrative Membership Management section within the existing admin dashboard.

Administrators with suitable permissions should be able to:

- View all members.
- Search and filter by membership category.
- Identify active and overdue memberships.
- View payment histories.
- View outstanding arrears.
- Configure subscription prices.
- Configure grace periods.
- Review payment reconciliation.
- Approve eligible membership changes.
- Suspend or reinstate membership access.
- View membership revenue analytics.
- Export membership reports.

Support authorised financial adjustments, with mandatory reasons, approval controls, and immutable audit records.

Do not allow administrators to silently delete settled payments or rewrite historical invoices.

## 10. DATABASE ARCHITECTURE

Inspect the existing Supabase/PostgreSQL schema before making changes.

Reuse relevant tables wherever possible.

The membership architecture should cover:

- Membership plans.
- Member subscriptions.
- Billing cycles.
- Subscription invoices.
- Invoice line items.
- Payment transactions.
- Payment allocations.
- Membership status history.
- Pricing history.
- Administrative adjustments.
- Audit logs.

Use PostgreSQL constraints and indexes to prevent duplicate billing records.

Store monetary amounts using safe exact representations, preferably integer minor units.

Enforce Row Level Security and role-based authorisation.

Members must only be able to access their own private financial records.

Financial administration must be limited to specifically authorised roles.

## 11. AUTOMATED BILLING

Implement a scheduled, server-side billing mechanism using the existing project's job infrastructure.

It should:

1. Identify subscriptions with new billing periods.
2. Generate each required invoice exactly once.
3. Preserve old unpaid invoices.
4. Recalculate total outstanding balances.
5. Update membership statuses.
6. Apply grace-period rules.
7. Create payment reminder notifications.
8. Maintain comprehensive billing logs.

The system must remain correct even if scheduled jobs are delayed, retried, or executed concurrently.

Do not rely on a member opening the website for recurring invoices to be generated.

## 12. PAYMENT REMINDERS

Introduce automated reminders using the existing email or notification infrastructure.

Send reminders:

- Before the payment due date.
- On the due date.
- After a payment becomes overdue.
- Before membership privileges are suspended.

Emails should display:

- Member's name.
- Membership category.
- Billing period.
- Current subscription charge.
- Previous outstanding arrears.
- Total outstanding amount.
- Secure payment link.

Do not repeatedly send duplicate reminders for the same notification event.

## 13. COOPERATIVE SAVINGS ARE SEPARATE

Real NDC is a developers' cooperative, so subscription fees must never be confused with member savings.

Keep separate records for:

- Registration fees.
- Membership subscription revenue.
- Member savings contributions.
- Cooperative share capital.
- Optional project development contributions.

If the codebase already contains savings, wallets, investment or contribution systems, preserve their integrity.

Do not automatically deduct membership arrears from member savings or wallets without a separately authorised payment instruction and legally valid consent.

## 14. TESTING AND QUALITY ASSURANCE

Write meaningful tests covering:

- First monthly subscription.
- First yearly subscription.
- Two unpaid monthly cycles.
- Three unpaid monthly cycles.
- Two unpaid yearly cycles.
- Student plan arrears.
- Payment after several missed cycles.
- Duplicate invoice prevention.
- Duplicate webhook delivery.
- Partial payment, if supported.
- Price changes.
- Monthly-to-yearly switching.
- Cancelled memberships.
- Grace period expiry.
- Suspended-member payments.
- Concurrent billing jobs.
- Missing scheduled executions.
- Invalid payment callbacks.
- Unauthorised access to another member's financial information.

## 15. IMPLEMENTATION PROCESS

Work in this sequence:

**Phase 1 — Codebase Audit**

Inspect the entire relevant codebase and explain what already exists, what can be reused, and what is missing.

**Phase 2 — Architecture**

Present the necessary database changes, API modifications, subscription lifecycle, billing calculations, and security controls.

**Phase 3 — Implementation**

Implement the approved approach using the existing project's architecture.

**Phase 4 — Dashboard Integration**

Connect the backend functionality to professional, responsive member and administrator interfaces.

**Phase 5 — Validation**

Run relevant tests, type checks and builds, and report any unresolved errors or migrations requiring approval.

### FINAL REQUIREMENTS

- Preserve the existing Real NDC visual identity and design system.
- Do not change unrelated functionality.
- Do not introduce duplicate authentication, payment, or membership systems.
- Avoid hardcoded pricing; load pricing from approved server-side settings.
- Do not apply destructive database changes.
- Do not use production credentials during testing.
- Do not invent migration success or payment verification results.
- Do not automatically deploy to production.
- Ask for approval before destructive, financially consequential, or irreversible operations.

**Start by auditing the existing codebase. Present the implementation plan and the exact billing calculations for approval before writing code.**