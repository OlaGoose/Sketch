'use client';

import { useSearchParams } from 'next/navigation';
import { CinematicContainer } from '@/components/CinematicContainer';

export default function CreatePage() {
  const searchParams = useSearchParams();
  const storybookId = searchParams.get('storybookId') || undefined;

  return (
    <main className="min-h-screen">
      <CinematicContainer storybookId={storybookId} />
    </main>
  );
}
