import * as Sentry from '@sentry/react';

const SENTRY_DSN = 'https://3c13beacc4734a54a69a39dcd4b138c3@o4511930129186816.ingest.us.sentry.io/4511930168967168';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development' or 'production'

    // Always enabled so errors are captured
    enabled: true,

    // Capture 100% of errors, 10% of performance traces
    tracesSampleRate: 0.1,

    // Attach user info to each error report
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Capture 10% of sessions for replay (only on error: 100%)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noisy / irrelevant errors
    ignoreErrors: [
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],

    beforeSend(event) {
      // Don't send errors triggered by browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        f => f.filename?.includes('extension://')
      )) {
        return null;
      }
      return event;
    },
  });

  // Expose Sentry globally for console debugging
  (window as any).Sentry = Sentry;
}

/**
 * Set Sentry user context after login.
 * Call this whenever a user logs in so errors are linked to their Discord ID.
 */
export function setSentryUser(discordId: string, icName: string) {
  Sentry.setUser({
    id: discordId,
    username: icName,
  });
}

/**
 * Clear Sentry user context after logout.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture a Supabase error with extra context.
 * Use this anywhere you do `const { data, error } = await supabase.from(...)`
 */
export function captureSupabaseError(
  error: { message: string; code?: string; details?: string; hint?: string },
  context: { operation: string; table?: string; [key: string]: unknown }
) {
  Sentry.withScope((scope) => {
    scope.setTag('type', 'supabase_error');
    scope.setTag('operation', context.operation);
    if (context.table) scope.setTag('table', context.table);
    scope.setContext('supabase', {
      code: error.code,
      details: error.details,
      hint: error.hint,
      ...context,
    });
    Sentry.captureException(new Error(`[Supabase] ${context.operation}: ${error.message}`));
  });
}

export { Sentry };
