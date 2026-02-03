'use client';

import { useCinematicStore } from '@/lib/store/cinematic-store';

export function LoadingView() {
  const loadingMsg = useCinematicStore((s) => s.loadingMsg);
  return (
    <div className="text-center">
      <div className="animate-spin h-16 w-16 border-8 border-loft-black border-t-loft-yellow rounded-full mx-auto mb-6" />
      <h2 className="text-2xl font-black bg-loft-yellow px-4 py-1 inline-block border-2 border-loft-black">
        {loadingMsg}
      </h2>
    </div>
  );
}
