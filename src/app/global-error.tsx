'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
};

export default function GlobalError({ error }: GlobalErrorProps): React.JSX.Element {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
