'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';

export function ZoomModal() {
  const currentImage = useCinematicStore((s) => s.currentImage);
  const isZoomed = useCinematicStore((s) => s.isZoomed);
  const setIsZoomed = useCinematicStore((s) => s.setIsZoomed);

  if (!isZoomed || !currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={() => setIsZoomed(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed image"
    >
      <img
        src={currentImage}
        alt="Zoomed scene"
        className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(254,220,0,0.3)]"
      />
      <button
        type="button"
        onClick={() => setIsZoomed(false)}
        className="absolute top-8 right-8 text-white hover:text-loft-yellow"
        aria-label="Close zoom"
      >
        <XMarkIcon className="h-10 w-10" />
      </button>
    </div>
  );
}
