'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { XMarkIcon, SpeakerWaveIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { VoiceClip } from '@/types';
import { SpeechBubble } from './SpeechBubble';

export function ZoomModal({
  onPlayClip,
  onStopClip,
}: {
  onPlayClip: (clip: VoiceClip) => void;
  onStopClip: () => void;
}) {
  const currentImage = useCinematicStore((s) => s.currentImage);
  const isZoomed = useCinematicStore((s) => s.isZoomed);
  const setIsZoomed = useCinematicStore((s) => s.setIsZoomed);
  const voiceClips = useCinematicStore((s) => s.voiceClips);
  const updateVoiceClip = useCinematicStore((s) => s.updateVoiceClip);
  const playingClipId = useCinematicStore((s) => s.playingClipId);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const updateSize = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) setImgSize({ w, h });
  }, []);

  useEffect(() => {
    if (!isZoomed || !currentImage) {
      setImgSize(null);
      return;
    }
    updateSize();
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) updateSize();
    else el.addEventListener('load', updateSize);
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => {
      el.removeEventListener('load', updateSize);
      ro.disconnect();
    };
  }, [isZoomed, currentImage, updateSize]);

  const handleMarkerClick = useCallback(
    (e: React.MouseEvent, clip: VoiceClip) => {
      e.stopPropagation();
      if (playingClipId === clip.id) onStopClip();
      else onPlayClip(clip);
    },
    [onPlayClip, onStopClip, playingClipId]
  );

  if (!isZoomed || !currentImage) return null;

  const clipsWithPosition = voiceClips.filter(
    (c): c is VoiceClip & { position: { x: number; y: number } } => c.position != null
  );
  const visibleClips = clipsWithPosition.filter((c) => !c.markerHidden);
  const hiddenClips = clipsWithPosition.filter((c) => c.markerHidden === true);

  const renderMarker = (
    clip: VoiceClip & { position: { x: number; y: number } },
    visible: boolean
  ) => (
    <div
      key={clip.id}
      className="absolute w-10 h-10"
      style={{
        left: `${clip.position.x}%`,
        top: `${clip.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {clip.speechBubbleVisible && (
        <SpeechBubble
          value={clip.speechBubbleText ?? ''}
          onChange={(text) => updateVoiceClip(clip.id, { speechBubbleText: text })}
          placeholder="Thoughts?"
        />
      )}
      <button
        type="button"
        onClick={(e) => handleMarkerClick(e, clip)}
        className={`absolute inset-0 w-10 h-10 flex items-center justify-center rounded-full border-2 border-loft-black transition-opacity touch-manipulation ${
          visible
            ? 'bg-loft-yellow hover:scale-110 active:scale-95 cursor-pointer'
            : 'opacity-0 hover:opacity-20 bg-loft-yellow cursor-pointer'
        }`}
        style={visible ? {} : undefined}
        title={playingClipId === clip.id ? 'Pause' : 'Play'}
      >
        {playingClipId === clip.id ? (
          <PauseCircleIcon className="h-5 w-5 text-loft-black pointer-events-none" />
        ) : (
          <SpeakerWaveIcon className="h-5 w-5 text-loft-black pointer-events-none" />
        )}
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed image"
    >
      <div className="relative flex items-center justify-center max-w-full max-h-full">
        <img
          ref={imgRef}
          src={currentImage}
          alt="Zoomed scene"
          className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(254,220,0,0.3)] block"
        />
        {imgSize && clipsWithPosition.length > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div
              className="relative bg-transparent pointer-events-auto"
              style={{ width: imgSize.w, height: imgSize.h }}
            >
              {visibleClips.map((clip) => renderMarker(clip, true))}
              {hiddenClips.map((clip) => renderMarker(clip, false))}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setIsZoomed(false)}
        className="absolute top-8 right-8 text-white hover:text-loft-yellow z-10"
        aria-label="Close zoom"
      >
        <XMarkIcon className="h-10 w-10" />
      </button>
    </div>
  );
}
