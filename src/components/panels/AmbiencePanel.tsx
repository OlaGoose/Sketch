'use client';

import { MusicalNoteIcon, PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { AmbienceType } from '@/types';

export function AmbiencePanel({
  isProcessing,
  onGenerateAmbience,
  bgAudioRef,
  onToggleBgAudio,
}: {
  isProcessing: boolean;
  onGenerateAmbience: () => void;
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
  onToggleBgAudio: () => void;
}) {
  const audioRef = bgAudioRef as React.RefObject<HTMLAudioElement>;
  const ambienceType = useCinematicStore((s) => s.ambienceType);
  const setAmbienceType = useCinematicStore((s) => s.setAmbienceType);
  const bgAudioUrl = useCinematicStore((s) => s.bgAudioUrl);
  const bgAudioName = useCinematicStore((s) => s.bgAudioName);
  const isBgPlaying = useCinematicStore((s) => s.isBgPlaying);
  const setIsBgPlaying = useCinematicStore((s) => s.setIsBgPlaying);
  const setBgAudioName = useCinematicStore((s) => s.setBgAudioName);
  const setBgAudioUrl = useCinematicStore((s) => s.setBgAudioUrl);

  const handleBgMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgAudioUrl(url);
      setBgAudioName(file.name);
      setIsBgPlaying(false);
    }
  };

  return (
    <div
      className={`bg-white border-4 border-loft-black p-4 relative ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <h3 className="font-black text-lg mb-2 flex items-center gap-2">
        <MusicalNoteIcon className="h-5 w-5" /> AMBIENCE
      </h3>
      <div className="flex flex-col gap-2">
        <div className="flex border-2 border-black mb-2">
          <button
            onClick={() => setAmbienceType('narration' as AmbienceType)}
            className={`flex-1 py-1 text-xs font-bold ${
              ambienceType === 'narration'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            NARRATION
          </button>
          <button
            onClick={() => setAmbienceType('music' as AmbienceType)}
            className={`flex-1 py-1 text-xs font-bold ${
              ambienceType === 'music'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            SOUNDSCAPE
          </button>
        </div>

        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 p-2 hover:bg-gray-50 cursor-pointer">
          <span className="text-xs font-bold text-gray-500">UPLOAD MP3/WAV</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleBgMusicUpload}
            className="hidden"
          />
        </label>
        <button
          onClick={onGenerateAmbience}
          className="w-full border-2 border-black bg-gray-100 text-xs font-bold py-2 hover:bg-loft-yellow"
        >
          AUTO-GENERATE (
          {ambienceType === 'music' ? 'MUSIC/FX' : 'NARRATION'})
        </button>

        {(bgAudioUrl || bgAudioName !== 'None') && (
          <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 border-l-4 border-loft-yellow">
            <span
              className="text-xs font-mono truncate max-w-[100px]"
              title={bgAudioName}
            >
              {bgAudioName}
            </span>
            <button onClick={onToggleBgAudio}>
              {isBgPlaying ? (
                <PauseCircleIcon className="h-5 w-5" />
              ) : (
                <PlayCircleIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
        <audio
          ref={audioRef}
          src={bgAudioUrl || undefined}
          loop
          className="hidden"
          onPlay={() => setIsBgPlaying(true)}
          onPause={() => setIsBgPlaying(false)}
        />
      </div>
    </div>
  );
}
