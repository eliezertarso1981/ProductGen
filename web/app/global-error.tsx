'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="text-sm text-neutral-600">O erro foi registrado. Tente novamente.</p>
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
          onClick={() => reset()}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
