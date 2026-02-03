'use client';

import { useCinematicStore } from '@/lib/store/cinematic-store';

export function UsageDisplay() {
  const tokenUsage = useCinematicStore((s) => s.tokenUsage);
  if (!tokenUsage) return null;
  return (
    <div className="bg-loft-black text-loft-yellow text-xs font-mono p-2 inline-block border-2 border-loft-yellow">
      <p>TOKENS: {tokenUsage.totalTokens.toLocaleString()}</p>
      <p>COST EST: {tokenUsage.estimatedCost}</p>
    </div>
  );
}
