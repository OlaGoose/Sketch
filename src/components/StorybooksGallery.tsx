'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, PlusIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { getAllStorybooks, saveStorybook } from '@/lib/db/cinematic-db';
import type { Storybook } from '@/types';
import { useDialog } from './DialogProvider';
import { ParticleBackground } from './ParticleBackground';
import { Header } from './Header';

export function StorybooksGallery() {
  const router = useRouter();
  const dialog = useDialog();
  const storybooks = useCinematicStore((s) => s.storybooks);
  const setStorybooks = useCinematicStore((s) => s.setStorybooks);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorybooks();
  }, []);

  const loadStorybooks = async () => {
    try {
      const books = await getAllStorybooks();
      setStorybooks(books);
    } catch (err) {
      console.error('Failed to load storybooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStorybook = async () => {
    const values = await dialog.prompt('New Storybook', [{ label: 'Title', placeholder: 'Enter storybook title' }]);
    if (!values || !values[0]?.trim()) return;

    const title = values[0].trim();
    const newStorybook: Storybook = {
      id: `storybook-${Date.now()}`,
      title,
      timestamp: Date.now(),
      updatedAt: Date.now(),
      pageIds: [],
    };

    try {
      await saveStorybook(newStorybook);
      setStorybooks([newStorybook, ...storybooks]);
      router.push(`/storybooks/${newStorybook.id}`);
    } catch (err) {
      console.error('Failed to create storybook:', err);
      await dialog.alert('Failed to create storybook');
    }
  };

  const handleOpenStorybook = (id: string) => {
    router.push(`/storybooks/${id}`);
  };

  const handlePlayCinema = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/storybooks/${id}/cinema`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-loft-black">
        <ParticleBackground />
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-white text-2xl">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-loft-black relative overflow-x-hidden">
      <ParticleBackground />
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 bg-transparent">
        <div className="w-full h-full p-8 z-20">
          <div className="text-center mb-12 relative">
            <h2 className="text-6xl font-black text-white tracking-widest drop-shadow-[4px_4px_0px_#FEDC00]">
              STORYBOOKS
            </h2>
            <p className="text-loft-yellow font-mono mt-2 tracking-widest">
              YOUR CINEMATIC COLLECTION
            </p>
          </div>

          <div className="max-w-7xl mx-auto mb-8">
            <button
              onClick={handleCreateStorybook}
              className="flex items-center gap-2 px-6 py-3 bg-loft-yellow text-loft-black font-bold border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              NEW STORYBOOK
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {storybooks.length === 0 ? (
              <div className="col-span-full text-center text-white opacity-50">
                <p className="text-2xl">No storybooks yet.</p>
                <p className="mt-2 text-sm">Create your first storybook to begin.</p>
              </div>
            ) : (
              storybooks.map((storybook) => (
                <div
                  key={storybook.id}
                  onClick={() => handleOpenStorybook(storybook.id)}
                  className="group relative perspective-1000 cursor-pointer"
                >
                  <div className="bg-black border-[1px] border-gray-800 p-4 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-loft-yellow">
                    {storybook.coverImage ? (
                      <img
                        src={storybook.coverImage}
                        alt={storybook.title}
                        className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-900 flex items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-500">
                        <BookOpenIcon className="h-24 w-24 text-gray-700" />
                      </div>
                    )}
                    
                    <div className="mt-4 border-t border-gray-800 pt-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-bold text-lg uppercase tracking-wide flex-1">
                          {storybook.title}
                        </h3>
                        <button
                          onClick={(e) => handlePlayCinema(e, storybook.id)}
                          className="ml-2 p-2 bg-loft-yellow text-loft-black rounded hover:bg-yellow-400 transition-colors"
                          title="Cinema Mode"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {storybook.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {storybook.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-mono">
                          {storybook.pageIds.length} {storybook.pageIds.length === 1 ? 'page' : 'pages'}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {new Date(storybook.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
