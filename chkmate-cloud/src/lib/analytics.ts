import posthog from 'posthog-js';

/**
 * PostHog Analytics Configuration
 *
 * Environment variables required:
 * - VITE_POSTHOG_KEY: Your PostHog project API key
 * - VITE_POSTHOG_HOST: PostHog host (defaults to https://app.posthog.com)
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_KEY) && typeof window !== 'undefined';
}

/**
 * Initialize PostHog analytics
 * Call this once at app startup
 */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled()) {
    console.log('PostHog analytics disabled: No API key configured');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture page views automatically
    capture_pageview: true,
    // Capture page leave events
    capture_pageleave: true,
    // Auto-capture clicks, form submissions, etc.
    autocapture: true,
    // Persist user identity across sessions
    persistence: 'localStorage',
    // Respect Do Not Track browser setting
    respect_dnt: true,
    // Disable in development if needed
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        // Optionally disable in dev
        // posthog.opt_out_capturing();
        console.log('PostHog initialized (dev mode)');
      }
    },
  });
}

/**
 * Identify a user after authentication
 * Call this after successful login/signup
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    name?: string;
    createdAt?: Date | string;
    plan?: string;
  }
): void {
  if (!isAnalyticsEnabled()) return;

  posthog.identify(userId, {
    email: traits?.email,
    name: traits?.name,
    created_at: traits?.createdAt,
    plan: traits?.plan || 'hobby',
  });
}

/**
 * Reset analytics state (call on logout)
 */
export function resetAnalytics(): void {
  if (!isAnalyticsEnabled()) return;
  posthog.reset();
}

/**
 * Track a custom event
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

/**
 * Set user properties (persistent traits)
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  posthog.people.set(properties);
}

/**
 * Track a page view manually (if needed beyond autocapture)
 */
export function trackPageView(pageName?: string): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    page_name: pageName,
  });
}

// ============================================================================
// PREDEFINED EVENTS
// These provide type safety and consistency across the app
// ============================================================================

/**
 * Event names used throughout the application
 */
export const AnalyticsEvents = {
  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',

  // Projects
  PROJECT_CREATED: 'project_created',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_VIEWED: 'project_viewed',

  // Templates
  TEMPLATE_SAVED: 'template_saved',
  TEMPLATE_DELETED: 'template_deleted',
  TEMPLATE_DOWNLOADED: 'template_downloaded',
  TEMPLATE_VIEWED: 'template_viewed',

  // Generation (Core Feature)
  GENERATION_STARTED: 'generation_started',
  GENERATION_COMPLETED: 'generation_completed',
  GENERATION_FAILED: 'generation_failed',

  // Builder Flow
  PROVIDER_SELECTED: 'provider_selected',
  DESIGN_STEP_ENTERED: 'design_step_entered',
  REVIEW_STEP_ENTERED: 'review_step_entered',
  CODE_STEP_ENTERED: 'code_step_entered',

  // Billing & Limits
  LIMIT_HIT: 'limit_hit',
  UPGRADE_MODAL_SHOWN: 'upgrade_modal_shown',
  UPGRADE_MODAL_DISMISSED: 'upgrade_modal_dismissed',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Engagement
  FEATURE_USED: 'feature_used',
  ERROR_ENCOUNTERED: 'error_encountered',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Waitlist
  WAITLIST_JOINED: 'waitlist_joined',
  INVITE_CODE_USED: 'invite_code_used',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// ============================================================================
// TYPED EVENT TRACKING FUNCTIONS
// These provide better DX with autocomplete and type checking
// ============================================================================

/**
 * Track project creation
 */
export function trackProjectCreated(projectId: string, projectName: string): void {
  trackEvent(AnalyticsEvents.PROJECT_CREATED, {
    project_id: projectId,
    project_name: projectName,
  });
}

/**
 * Track project deletion
 */
export function trackProjectDeleted(projectId: string): void {
  trackEvent(AnalyticsEvents.PROJECT_DELETED, {
    project_id: projectId,
  });
}

/**
 * Track generation start
 */
export function trackGenerationStarted(
  provider: string,
  promptLength: number
): void {
  trackEvent(AnalyticsEvents.GENERATION_STARTED, {
    provider,
    prompt_length: promptLength,
    prompt_word_count: promptLength > 0 ? promptLength.toString().split(/\s+/).length : 0,
  });
}

/**
 * Track successful generation
 */
export function trackGenerationCompleted(
  provider: string,
  filesCount: number,
  estimatedCost?: number
): void {
  trackEvent(AnalyticsEvents.GENERATION_COMPLETED, {
    provider,
    files_count: filesCount,
    estimated_monthly_cost: estimatedCost,
  });
}

/**
 * Track generation failure
 */
export function trackGenerationFailed(
  provider: string,
  errorCode: string,
  errorMessage?: string
): void {
  trackEvent(AnalyticsEvents.GENERATION_FAILED, {
    provider,
    error_code: errorCode,
    error_message: errorMessage,
  });
}

/**
 * Track template save
 */
export function trackTemplateSaved(
  templateId: string,
  provider: string,
  projectId: string
): void {
  trackEvent(AnalyticsEvents.TEMPLATE_SAVED, {
    template_id: templateId,
    provider,
    project_id: projectId,
  });
}

/**
 * Track template download
 */
export function trackTemplateDownloaded(
  templateId: string,
  fileName: string,
  provider: string
): void {
  trackEvent(AnalyticsEvents.TEMPLATE_DOWNLOADED, {
    template_id: templateId,
    file_name: fileName,
    provider,
  });
}

/**
 * Track provider selection in builder
 */
export function trackProviderSelected(provider: string): void {
  trackEvent(AnalyticsEvents.PROVIDER_SELECTED, {
    provider,
  });
}

/**
 * Track upgrade modal shown
 */
export function trackUpgradeModalShown(
  trigger: 'limit_hit' | 'manual' | 'feature_gate',
  currentPlan: string
): void {
  trackEvent(AnalyticsEvents.UPGRADE_MODAL_SHOWN, {
    trigger,
    current_plan: currentPlan,
  });
}

/**
 * Track limit hit
 */
export function trackLimitHit(
  limitType: 'generation' | 'project' | 'template',
  currentUsage: number,
  limit: number
): void {
  trackEvent(AnalyticsEvents.LIMIT_HIT, {
    limit_type: limitType,
    current_usage: currentUsage,
    limit,
    usage_percentage: Math.round((currentUsage / limit) * 100),
  });
}

/**
 * Track error encountered
 */
export function trackErrorEncountered(
  errorCode: string,
  errorMessage: string,
  context?: string
): void {
  trackEvent(AnalyticsEvents.ERROR_ENCOUNTERED, {
    error_code: errorCode,
    error_message: errorMessage,
    context,
    url: window.location.pathname,
  });
}

/**
 * Track waitlist signup
 */
export function trackWaitlistJoined(email: string, referrer?: string): void {
  trackEvent(AnalyticsEvents.WAITLIST_JOINED, {
    // Don't send full email for privacy, just domain
    email_domain: email.split('@')[1],
    referrer,
  });
}
