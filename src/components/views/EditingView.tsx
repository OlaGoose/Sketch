'use client';

import { useCallback, useRef, useEffect } from 'react';
import { MagnifyingGlassPlusIcon, SpeakerWaveIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { VoiceClip } from '@/types';
import { UsageDisplay } from '../UsageDisplay';
import { MagicStudioPanel } from '../panels/MagicStudioPanel';
import { RegeneratePanel } from '../panels/RegeneratePanel';
import { VoicePanel } from '../panels/VoicePanel';
import { AmbiencePanel } from '../panels/AmbiencePanel';

/** Speech bubble above voice marker: white pill shape, rounded tail + dot, editable text, adaptive size */
function SpeechBubble({
  value,
  onChange,
  placeholder = 'Thoughts?',
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el || el === document.activeElement) return;
    if (el.innerText !== value) el.innerText = value;
  }, [value]);

  const handleInput = useCallback(() => {
    const el = divRef.current;
    if (el) onChange(el.innerText || '');
  }, [onChange]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex flex-col items-center pointer-events-auto w-max"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative flex flex-col items-center w-full">
        <div className="bg-white rounded-[1.25rem] px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] min-w-[72px] max-w-[240px] w-fit">
          <div
            ref={divRef}
            contentEditable
            suppressContentEditableWarning
            className="text-[#5B5B5B] font-medium text-sm outline-none whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            data-placeholder={placeholder}
            style={{ caretColor: '#FF69B4' }}
            onInput={handleInput}
          />
        </div>
        {/* Tail pointing down */}
        <div
          className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white -mt-px"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))' }}
        />
        <div
          className="absolute top-full w-2 h-2 bg-white rounded-full mt-[-5px]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
        />
      </div>
    </div>
  );
}

export function EditingView({
  isProcessing,
  loadingMsg,
  onTextEdit,
  onRegenerate,
  onGenerateSpeech,
  onPlayClip,
  onStopClip,
  onGenerateAmbience,
  onToggleBgAudio,
  onSaveToGallery,
  bgAudioRef,
}: {
  isProcessing: boolean;
  loadingMsg: string;
  onTextEdit: () => void;
  onRegenerate: () => void;
  onGenerateSpeech: () => void;
  onPlayClip: (clip: VoiceClip) => void;
  onStopClip: () => void;
  onGenerateAmbience: () => void;
  onToggleBgAudio: () => void;
  onSaveToGallery: () => void;
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const currentImage = useCinematicStore((s) => s.currentImage);
  const isZoomed = useCinematicStore((s) => s.isZoomed);
  const setIsZoomed = useCinematicStore((s) => s.setIsZoomed);
  const voiceClips = useCinematicStore((s) => s.voiceClips);
  const setVoiceClipPosition = useCinematicStore((s) => s.setVoiceClipPosition);
  const updateVoiceClip = useCinematicStore((s) => s.updateVoiceClip);
  const playingClipId = useCinematicStore((s) => s.playingClipId);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('application/voice-clip-id');
      if (!id) return;
      const container = imageContainerRef.current;
      if (container && container.contains(e.target as Node)) {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setVoiceClipPosition(id, { x, y });
      } else {
        updateVoiceClip(id, { position: undefined });
      }
    },
    [setVoiceClipPosition, updateVoiceClip]
  );

  const handleMarkerClick = useCallback(
    (e: React.MouseEvent, clip: VoiceClip) => {
      e.stopPropagation();
      if (playingClipId === clip.id) onStopClip();
      else onPlayClip(clip);
    },
    [onPlayClip, onStopClip, playingClipId]
  );

  if (!currentImage) return null;

  return (
    <div
      className="w-full max-w-[1440px] flex flex-col relative pb-20"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {isProcessing && (
        <div className="w-full bg-loft-yellow border-b-4 border-loft-black p-2 text-center mb-4 animate-pulse flex items-center justify-center gap-2 shadow-lg">
          <div className="animate-spin h-5 w-5 border-4 border-black border-t-transparent rounded-full" />
          <span className="font-black text-black uppercase">{loadingMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4 flex flex-col gap-6 order-2 lg:order-1">
          <MagicStudioPanel isProcessing={isProcessing} onTextEdit={onTextEdit} />
        </div>

        <div className="lg:w-1/2 relative order-1 lg:order-2">
          <div
            ref={imageContainerRef}
            className="relative border-4 border-loft-black bg-black group overflow-hidden shadow-[12px_12px_0px_0px_#FEDC00]"
          >
            <img
              src={currentImage}
              alt="Generated Scene"
              className={`w-full h-auto transition-transform duration-500 ${
                isZoomed ? 'scale-150' : 'cursor-default'
              } ${isProcessing ? 'opacity-50 blur-[2px]' : ''}`}
              draggable={false}
            />
            {!isZoomed && (
              <>
                {voiceClips
                  .filter(
                    (c): c is VoiceClip & { position: { x: number; y: number } } =>
                      c.position != null && !c.markerHidden
                  )
                  .map((clip) => (
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
                          onChange={(text) =>
                            updateVoiceClip(clip.id, { speechBubbleText: text })
                          }
                          placeholder="Thoughts?"
                        />
                      )}
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/voice-clip-id', clip.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={(e) => handleMarkerClick(e, clip)}
                        className="absolute inset-0 w-10 h-10 flex items-center justify-center bg-loft-yellow border-2 border-loft-black rounded-full hover:scale-110 active:scale-95 transition-transform touch-manipulation cursor-grab active:cursor-grabbing"
                        title={playingClipId === clip.id ? 'Pause' : 'Play / drag to move'}
                      >
                        {playingClipId === clip.id ? (
                          <PauseCircleIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        ) : (
                          <SpeakerWaveIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        )}
                      </button>
                    </div>
                  ))}
                {voiceClips
                  .filter(
                    (c): c is VoiceClip & { position: { x: number; y: number } } =>
                      c.position != null && c.markerHidden === true
                  )
                  .map((clip) => (
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
                          onChange={(text) =>
                            updateVoiceClip(clip.id, { speechBubbleText: text })
                          }
                          placeholder="Thoughts?"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleMarkerClick(e, clip)}
                        className="absolute inset-0 w-10 h-10 flex items-center justify-center rounded-full opacity-0 hover:opacity-20 bg-loft-yellow border-2 border-loft-black transition-opacity touch-manipulation"
                        title={playingClipId === clip.id ? 'Pause' : 'Play'}
                      >
                        {playingClipId === clip.id ? (
                          <PauseCircleIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        ) : (
                          <SpeakerWaveIcon className="h-5 w-5 text-loft-black pointer-events-none" />
                        )}
                      </button>
                    </div>
                  ))}
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="absolute top-4 right-4 bg-loft-yellow border-2 border-loft-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Zoom in"
                >
                  <MagnifyingGlassPlusIcon className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-white border-2 border-loft-black p-4 gap-4">
            <UsageDisplay />
            <button
              onClick={onSaveToGallery}
              disabled={isProcessing}
              className="bg-black text-white px-6 py-2 font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white w-full sm:w-auto"
            >
              SAVE TO GALLERY
            </button>
          </div>
        </div>

        <div className="lg:w-1/4 flex flex-col gap-6 order-3">
          <RegeneratePanel
            isProcessing={isProcessing}
            onRegenerate={onRegenerate}
          />
          <VoicePanel
            isProcessing={isProcessing}
            onGenerateSpeech={onGenerateSpeech}
            onPlayClip={onPlayClip}
            onStopClip={onStopClip}
            playingClipId={playingClipId}
          />
          <AmbiencePanel
            isProcessing={isProcessing}
            onGenerateAmbience={onGenerateAmbience}
            onToggleBgAudio={onToggleBgAudio}
            bgAudioRef={bgAudioRef}
          />
        </div>
      </div>
    </div>
  );
}
