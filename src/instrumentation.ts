import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function register(): void {
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: true,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: true,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
