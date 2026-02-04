'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CinematicContainer } from '@/components/CinematicContainer';

function CreateContent() {
  const searchParams = useSearchParams();
  const storybookId = searchParams.get('storybookId') || undefined;
  return (
    <main className="min-h-screen">
      <CinematicContainer storybookId={storybookId} />
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-loft-gray"><div className="animate-pulse text-loft-black font-bold">Loading...</div></main>}>
      <CreateContent />
    </Suspense>
  );
}
