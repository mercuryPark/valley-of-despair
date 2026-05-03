import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default sentryOrg && sentryProject && sentryAuthToken
  ? withSentryConfig(nextConfig, {
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuthToken,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
    })
  : nextConfig;
