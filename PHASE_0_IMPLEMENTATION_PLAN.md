# Chkmate Phase 0 Implementation Plan

> Target: DevOps Freelancers & Agencies ($1M ARR Goal)

## Executive Summary

Phase 0 transforms the current POC into a monetizable SaaS by adding billing infrastructure, usage controls, and growth mechanics. Implementation spans 3 weeks across 6 core tasks.

---

## Implementation Timeline

```
Week 1: Foundation
├── Task 3: Error Handling (Day 1-2)
├── Task 4: Loading States & UX (Day 2-3)
└── Task 5: PostHog Analytics (Day 3-4)

Week 2: Core SaaS
├── Task 1: Stripe Integration (Day 1-3)
└── Task 2: Usage Tracking (Day 3-5)

Week 3: Growth
└── Task 6: Waitlist/Early Access (Day 1-3)
```

---

## Task 1: Stripe Integration

### Pricing Tiers
| Plan | Price | Generations | Projects | Templates |
|------|-------|-------------|----------|-----------|
| Hobby | Free | 5/mo | 3 | 10 |
| Pro | $29/mo | 100/mo | 50 | 500 |
| Team | $99/mo | Unlimited | Unlimited | Unlimited |

### Database Schema Changes

```prisma
// Add to User model
stripeCustomerId     String?   @unique
stripeSubscriptionId String?
stripePriceId        String?
stripeCurrentPeriodEnd DateTime?
plan                 Plan      @default(HOBBY)

enum Plan {
  HOBBY
  PRO
  TEAM
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/stripe/create-checkout-session` | Start subscription |
| POST | `/api/stripe/create-portal-session` | Manage subscription |
| POST | `/api/stripe/webhook` | Handle Stripe events |
| GET | `/api/user/subscription` | Get current plan |

### Files to Create/Modify

**Backend:**
- `server/lib/stripe.ts` - Stripe client + helpers
- `server/lib/plans.ts` - Plan configuration constants
- `server/index.ts` - Add Stripe routes

**Frontend:**
- `src/pages/Pricing.tsx` - Dedicated pricing page
- `src/pages/Settings.tsx` - Subscription management
- `src/components/UpgradeModal.tsx` - Upgrade prompts
- `src/components/UsageBadge.tsx` - Usage indicator

### Environment Variables

```env
# Server
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_yyy

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## Task 2: Usage Tracking

### Database Schema

```prisma
model UsageRecord {
  id        String   @id @default(uuid())
  userId    String
  type      UsageType
  count     Int      @default(1)
  period    DateTime // First of month
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, type, period])
}

enum UsageType {
  GENERATION
  PROJECT_CREATE
  TEMPLATE_CREATE
}
```

### Implementation

**Middleware:** `server/middleware/usageLimit.ts`
```typescript
// Check usage before allowing generation
// Return 402 if over limit
export const checkUsageLimit = (usageType: UsageType) => async (req, res, next) => {
  const user = req.user;
  const plan = PLANS[user.plan];
  const usage = await getCurrentUsage(user.id, usageType);

  if (plan.limits[usageType] !== -1 && usage >= plan.limits[usageType]) {
    return res.status(402).json({
      error: true,
      code: 'PAYMENT_REQUIRED',
      message: 'Plan limit reached',
      details: { usage, limit: plan.limits[usageType] }
    });
  }

  next();
};
```

**Apply to /api/generate:**
```typescript
app.post('/api/generate',
  requireAuth,
  checkUsageLimit('GENERATION'),
  async (req, res) => {
    // ... generation logic ...
    // Increment usage after success
  }
);
```

---

## Task 3: Error Handling

### Backend Error Classes

```typescript
// server/lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Upgrade required', details?: any) {
    super(message, 402, 'PAYMENT_REQUIRED', details);
  }
}
```

### Frontend Error Handling

```typescript
// src/lib/errors.ts
export const ERROR_MESSAGES: Record<string, string> = {
  'PAYMENT_REQUIRED': "You've reached your plan limit. Upgrade to continue.",
  'GENERATION_FAILED': "Generation failed. Try rephrasing your request.",
  'RATE_LIMIT': "Too many requests. Please wait a moment.",
  'INTERNAL_ERROR': "Something went wrong. Please try again."
};
```

### Components

- `src/components/ErrorBoundary.tsx` - Catch render errors
- `src/components/Toast.tsx` - Notification system
- `src/hooks/useToast.ts` - Toast management

---

## Task 4: Loading States & UX Polish

### Components to Create

| Component | Purpose |
|-----------|---------|
| `Skeleton.tsx` | Loading placeholders |
| `Button.tsx` | Enhanced button with loading state |
| `EmptyState.tsx` | Empty state displays |
| `PageLoader.tsx` | Full-page loading |

### Page Enhancements

**Dashboard.tsx:**
- Real data fetching
- Usage progress bar
- Skeleton loaders

**Projects.tsx:**
- Skeleton cards while loading
- Animated card entrance
- Success toasts

**Builder.tsx:**
- Step transition animations
- Multi-stage loading (Analyzing → Designing → Generating)
- Auto-save drafts

### Animation Utilities

```typescript
// src/lib/animations.ts
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

---

## Task 5: Analytics (PostHog)

### Setup

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export const initAnalytics = () => {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    autocapture: true
  });
};

export const trackEvent = (event: string, properties?: Record<string, any>) => {
  posthog.capture(event, properties);
};
```

### Key Events to Track

| Event | When | Properties |
|-------|------|------------|
| `generation_started` | User clicks Generate | provider, prompt_length |
| `generation_completed` | Generation succeeds | provider, files_count, cost |
| `generation_failed` | Generation fails | provider, error_code |
| `upgrade_modal_shown` | Limit hit | trigger, current_plan |
| `checkout_started` | User starts checkout | plan |
| `template_saved` | User saves template | provider, project_id |
| `template_downloaded` | User downloads file | file_type |

### Environment Variables

```env
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

---

## Task 6: Waitlist/Early Access

### Database Schema

```prisma
model WaitlistEntry {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  company   String?
  useCase   String?
  referrer  String?
  status    WaitlistStatus @default(PENDING)
  inviteCode String? @unique
  invitedAt DateTime?
  createdAt DateTime @default(now())
}

enum WaitlistStatus {
  PENDING
  INVITED
  CONVERTED
}

model InviteCode {
  id        String   @id @default(uuid())
  code      String   @unique
  maxUses   Int      @default(1)
  uses      Int      @default(0)
  expiresAt DateTime?
  createdAt DateTime @default(now())
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/waitlist` | Join waitlist |
| GET | `/api/waitlist/position/:email` | Check position |
| POST | `/api/invite/validate` | Validate invite code |

### Components

- `src/components/WaitlistForm.tsx` - Signup form
- `src/components/InviteCodeInput.tsx` - Code validation
- `src/pages/Waitlist.tsx` - Dedicated landing
- `src/pages/Invite.tsx` - Invite entry

### Feature Flags

```typescript
// src/lib/config.ts
export const config = {
  waitlistMode: import.meta.env.VITE_WAITLIST_MODE === 'true',
  inviteOnly: import.meta.env.VITE_INVITE_ONLY === 'true'
};
```

---

## File Summary

### Backend Files (12 total)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | MODIFY - Add Plan, UsageRecord, Waitlist models |
| `index.ts` | MODIFY - Add all new routes |
| `lib/stripe.ts` | CREATE |
| `lib/plans.ts` | CREATE |
| `lib/errors.ts` | CREATE |
| `lib/email.ts` | CREATE |
| `middleware/errorHandler.ts` | CREATE |
| `middleware/usageLimit.ts` | CREATE |
| `middleware/auth.ts` | CREATE |

### Frontend Files (25+ total)

| Category | Files |
|----------|-------|
| Lib | `api.ts` (modify), `errors.ts`, `analytics.ts`, `animations.ts`, `config.ts` |
| Context | `SubscriptionContext.tsx` |
| Hooks | `useSubscription.ts`, `useToast.ts` |
| Components | `ErrorBoundary`, `Toast`, `Skeleton`, `Button`, `EmptyState`, `UpgradeModal`, `UsageBadge`, `WaitlistForm`, `InviteCodeInput` |
| Pages | `Pricing`, `Settings`, `Waitlist`, `Invite` (new) + `Dashboard`, `Builder`, `Projects`, `LandingPage` (modify) |

---

## Dependencies to Install

**Server:**
```bash
npm install stripe
```

**Frontend:**
```bash
npm install posthog-js
```

---

## Testing Checklist

### Stripe
- [ ] Checkout creates session
- [ ] Webhook updates subscription
- [ ] Portal manages billing
- [ ] Failed payments handled

### Usage
- [ ] Limits enforced per plan
- [ ] Usage increments correctly
- [ ] Reset at billing period
- [ ] Upgrade modal at limit

### Error Handling
- [ ] Consistent error format
- [ ] User-friendly messages
- [ ] Error boundary works
- [ ] Toast notifications

### UX
- [ ] Skeletons show during load
- [ ] Buttons show loading
- [ ] Smooth transitions
- [ ] Mobile responsive

### Analytics
- [ ] PostHog initializes
- [ ] User identified
- [ ] Events tracked
- [ ] Reset on logout

### Waitlist
- [ ] Email submission works
- [ ] Position calculated
- [ ] Invite codes validate
- [ ] Emails send

---

## Quick Start Commands

```bash
# After Stripe setup
cd server && npx prisma migrate dev --name add_subscriptions

# Install dependencies
cd server && npm install stripe
cd ../chkmate-cloud && npm install posthog-js

# Set environment variables (see each task section)
```

---

## Next Steps After Phase 0

1. **Beta Launch** - Invite 10 DevOps freelancers
2. **Content SEO** - "How to estimate AWS costs for client projects"
3. **Build in Public** - Tweet progress daily
4. **Iterate Based on Analytics** - Watch PostHog for drop-offs
