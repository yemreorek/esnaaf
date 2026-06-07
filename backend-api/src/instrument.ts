// Sentry Error Tracking — only initializes if packages are installed and SENTRY_DSN is set
try {
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/nestjs');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      profilesSampleRate: 0.1,
    });
  }
} catch (e) {
  // @sentry packages not installed — silently skip
}
