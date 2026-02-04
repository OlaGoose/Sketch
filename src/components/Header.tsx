'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FilmIcon } from '@heroicons/react/24/outline';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <header className="w-full bg-loft-yellow border-b-4 border-loft-black p-4 flex justify-between items-center sticky top-0 z-50">
      <button
        onClick={() => handleNavigation('/')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <FilmIcon className="h-8 w-8 text-loft-black" />
        <h1 className="font-display font-black text-2xl tracking-tighter uppercase">
          Cinematic<span className="font-light">Sketch</span>
        </h1>
      </button>
      <nav className="flex gap-4 font-bold text-sm">
        <button
          onClick={() => handleNavigation('/')}
          className={`hover:underline ${pathname === '/' ? 'underline' : ''}`}
        >
          STORYBOOKS
        </button>
        <button
          onClick={() => handleNavigation('/create')}
          className={`hover:underline ${pathname === '/create' ? 'underline' : ''}`}
        >
          CREATE
        </button>
      </nav>
    </header>
  );
}
