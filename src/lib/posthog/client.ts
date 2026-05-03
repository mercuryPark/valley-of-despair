'use client';

import posthog, { type PostHog } from 'posthog-js';

let initialized = false;

export function getPostHog(): PostHog | null {
  if (typeof window === 'undefined') return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return null;

  if (!initialized) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: 'identified_only',
      defaults: '2025-05-24',
    });
    initialized = true;
  }

  return posthog;
}
