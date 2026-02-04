'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';
import { getStorybookById, getPagesByStorybookId } from '@/lib/db/cinematic-db';
import type { Storybook, StorybookPage, VoiceClip } from '@/types';
import { useDialog } from './DialogProvider';
import { playVoiceClip } from '@/utils/audio';

interface CinemaModeProps {
  storybookId: string;
}

export function CinemaMode({ storybookId }: CinemaModeProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [storybook, setStorybook] = useState<Storybook | null>(null);
  const [pages, setPages] = useState<StorybookPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceStopRef = useRef<(() => void) | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      if (voiceStopRef.current) {
        voiceStopRef.current();
      }
    };
  }, [storybookId]);

  const currentPage = pages[currentPageIndex];
  const isVideoPage = currentPage?.type === 'video';

  useEffect(() => {
    if (!isAutoPlaying || isPlayingAudio) {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      return;
    }
    if (isVideoPage) {
      return;
    }
    autoPlayTimerRef.current = setTimeout(() => {
      handleNext();
    }, 5000);
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, currentPageIndex, isPlayingAudio, isVideoPage]);

  useEffect(() => {
    if (!isVideoPage || !isAutoPlaying || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [currentPageIndex, isVideoPage, isAutoPlaying]);

  const loadData = async () => {
    try {
      const book = await getStorybookById(storybookId);
      if (!book) {
        await dialog.alert('Storybook not found');
        router.push('/');
        return;
      }
      setStorybook(book);

      const bookPages = await getPagesByStorybookId(storybookId);
      setPages(bookPages);
    } catch (err) {
      console.error('Failed to load storybook:', err);
      await dialog.alert('Failed to load storybook');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      stopAllAudio();
    }
  };

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      stopAllAudio();
    } else {
      setIsAutoPlaying(false);
    }
  };

  const handleToggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleClose = () => {
    router.push(`/storybooks/${storybookId}`);
  };

  const stopAllAudio = () => {
    if (voiceStopRef.current) {
      voiceStopRef.current();
      voiceStopRef.current = null;
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setPlayingClipId(null);
  };

  const handlePlayVoiceClip = useCallback((clip: VoiceClip) => {
    if (!clip.audioSrc) return;

    if (playingClipId === clip.id) {
      if (voiceStopRef.current) {
        voiceStopRef.current();
        voiceStopRef.current = null;
      }
      setPlayingClipId(null);
      setIsPlayingAudio(false);
      return;
    }

    stopAllAudio();

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    const onPlayingChange = (playing: boolean) => {
      setIsPlayingAudio(playing);
      if (!playing) setPlayingClipId(null);
    };

    setPlayingClipId(clip.id);
    voiceStopRef.current = playVoiceClip(
      clip.audioSrc,
      { volume: clip.volume, playCount: clip.playCount, loop: clip.loop },
      ctx,
      onPlayingChange
    );
  }, [playingClipId]);

  const handlePlayBgAudio = useCallback((url: string) => {
    if (!bgAudioRef.current) {
      bgAudioRef.current = new Audio(url);
      bgAudioRef.current.onended = () => setIsPlayingAudio(false);
      bgAudioRef.current.onpause = () => setIsPlayingAudio(false);
      bgAudioRef.current.onplay = () => setIsPlayingAudio(true);
    } else {
      bgAudioRef.current.src = url;
    }
    bgAudioRef.current.play();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (!storybook || pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <p className="text-white text-2xl mb-4">
          {pages.length === 0 ? 'No pages in this storybook' : 'Storybook not found'}
        </p>
        <button
          onClick={handleClose}
          className="px-6 py-3 bg-loft-yellow text-loft-black font-bold"
        >
          CLOSE
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6 flex justify-between items-start">
        <div>
          <h1 className="text-white text-2xl font-bold">{storybook.title}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Page {currentPageIndex + 1} of {pages.length}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentPage.type === 'text' && (
          <div className="max-w-4xl w-full bg-white/5 backdrop-blur-sm p-12 rounded-lg">
            {currentPage.title && (
              <h2 className="text-white text-4xl font-bold mb-6">
                {currentPage.title}
              </h2>
            )}
            {currentPage.content && (
              <p className="text-white text-xl leading-relaxed whitespace-pre-wrap">
                {currentPage.content}
              </p>
            )}
          </div>
        )}

        {currentPage.type === 'webpage' && currentPage.url && (
          <div className="max-w-6xl w-full h-[80vh]">
            <iframe
              src={currentPage.url}
              className="w-full h-full border-4 border-loft-yellow"
              title={currentPage.title || 'Webpage'}
            />
          </div>
        )}

        {currentPage.type === 'image' && currentPage.imageUrl && (
          <div className="max-w-6xl w-full">
            <img
              src={currentPage.imageUrl}
              alt={currentPage.title || 'Image'}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {currentPage.title && (
              <p className="text-white text-center mt-4 text-xl">
                {currentPage.title}
              </p>
            )}
          </div>
        )}

        {currentPage.type === 'audio-image' && currentPage.imageUrl && (
          <div className="max-w-6xl w-full">
            <div className="relative group">
              <img
                src={currentPage.imageUrl}
                alt={currentPage.title || 'Audio Image'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              {currentPage.voiceClips && currentPage.voiceClips.length > 0 && (
                <>
                  {currentPage.voiceClips.map((clip, index) => {
                    const hasPosition = clip.position != null && typeof clip.position.x === 'number' && typeof clip.position.y === 'number';
                    const x = hasPosition ? clip.position!.x : (100 * (index + 1)) / (currentPage.voiceClips!.length + 1);
                    const y = hasPosition ? clip.position!.y : 85;
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoiceClip(clip);
                        }}
                        className="absolute w-10 h-10 flex items-center justify-center bg-loft-yellow border-2 border-loft-black rounded-full opacity-0 group-hover:opacity-90 hover:!opacity-100 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={playingClipId === clip.id ? 'Pause' : 'Play'}
                      >
                        {playingClipId === clip.id ? (
                          <PauseCircleIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        ) : (
                          <SpeakerWaveIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            {currentPage.quote && (
              <p className="text-loft-yellow text-center mt-4 text-xl italic">
                &quot;{currentPage.quote}&quot;
              </p>
            )}
            {currentPage.backgroundAudioUrl && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => handlePlayBgAudio(currentPage.backgroundAudioUrl!)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-loft-black font-bold border-2 border-loft-black shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <SpeakerWaveIcon className="h-5 w-5" />
                  Play Background Audio
                </button>
              </div>
            )}
          </div>
        )}

        {currentPage.type === 'video' && currentPage.videoUrl && (
          <div className="max-w-6xl w-full">
            <video
              ref={videoRef}
              src={currentPage.videoUrl}
              className="w-full h-auto max-h-[80vh]"
              onEnded={() => {
                if (isAutoPlaying) handleNext();
              }}
            />
            {currentPage.title && (
              <p className="text-white text-center mt-4 text-xl">
                {currentPage.title}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentPageIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          PREVIOUS
        </button>

        <button
          onClick={handleToggleAutoPlay}
          className="flex items-center gap-2 px-8 py-3 bg-loft-yellow text-loft-black font-bold rounded hover:bg-yellow-400 transition-colors"
        >
          {isAutoPlaying ? (
            <>
              <PauseIcon className="h-5 w-5" />
              PAUSE
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5" />
              AUTO PLAY
            </>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentPageIndex === pages.length - 1}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded transition-colors"
        >
          NEXT
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
