'use client';

import { SpeakerWaveIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { AppState } from '@/types';

export function GalleryView() {
  const gallery = useCinematicStore((s) => s.gallery);
  const setAppState = useCinematicStore((s) => s.setAppState);
  const loadFromGallery = useCinematicStore((s) => s.loadFromGallery);

  return (
    <div className="w-full h-full p-8 z-20">
      <div className="text-center mb-12 relative">
        <h2 className="text-6xl font-black text-white tracking-widest drop-shadow-[4px_4px_0px_#FEDC00]">
          THEATER
        </h2>
        <p className="text-loft-yellow font-mono mt-2 tracking-widest">
          COLLECTION OF FATE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
        {gallery.length === 0 ? (
          <div className="col-span-full text-center text-white opacity-50">
            <p className="text-2xl">The theater is empty.</p>
            <button
              onClick={() => setAppState(AppState.UPLOAD)}
              className="mt-4 underline text-loft-yellow"
            >
              Create your first masterpiece
            </button>
          </div>
        ) : (
          gallery.map((item) => (
            <div
              key={item.id}
              onClick={() => loadFromGallery(item)}
              className="group relative perspective-1000 cursor-pointer"
            >
              <div className="bg-black border-[1px] border-gray-800 p-2 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-loft-yellow">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="mt-4 border-t border-gray-800 pt-2 flex justify-between items-end">
                  <div className="overflow-hidden">
                    <p className="text-gray-400 text-xs font-mono uppercase truncate max-w-[90%]">
                      {item.prompt}
                    </p>
                    {item.quote && (
                      <p className="text-loft-yellow text-xs italic mt-1 truncate">
                        &quot;{item.quote}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(item.audioData || (item.voiceClips && item.voiceClips.length > 0)) && (
                      <SpeakerWaveIcon className="h-3 w-3 text-white" />
                    )}
                    {item.backgroundAudioUrl && (
                      <MusicalNoteIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
