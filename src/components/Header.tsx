'use client';

import { FilmIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { AppState } from '@/types';

export function Header() {
  const appState = useCinematicStore((s) => s.appState);
  const setAppState = useCinematicStore((s) => s.setAppState);

  return (
    <header className="w-full bg-loft-yellow border-b-4 border-loft-black p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <FilmIcon className="h-8 w-8 text-loft-black" />
        <h1 className="font-display font-black text-2xl tracking-tighter uppercase">
          Cinematic<span className="font-light">Sketch</span>
        </h1>
      </div>
      <nav className="flex gap-4 font-bold text-sm">
        <button
          onClick={() => setAppState(AppState.UPLOAD)}
          className="hover:underline"
        >
          NEW PROJECT
        </button>
        <button
          onClick={() => setAppState(AppState.GALLERY)}
          className="hover:underline"
        >
          GALLERY
        </button>
      </nav>
    </header>
  );
}
