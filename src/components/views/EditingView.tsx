'use client';

import { MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { UsageDisplay } from '../UsageDisplay';
import { MagicStudioPanel } from '../panels/MagicStudioPanel';
import { RegeneratePanel } from '../panels/RegeneratePanel';
import { VoicePanel } from '../panels/VoicePanel';
import { AmbiencePanel } from '../panels/AmbiencePanel';

export function EditingView({
  isProcessing,
  loadingMsg,
  onTextEdit,
  onRegenerate,
  onGenerateSpeech,
  onPlayVoice,
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
  onPlayVoice: () => void;
  onGenerateAmbience: () => void;
  onToggleBgAudio: () => void;
  onSaveToGallery: () => void;
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const currentImage = useCinematicStore((s) => s.currentImage);
  const isZoomed = useCinematicStore((s) => s.isZoomed);
  const setIsZoomed = useCinematicStore((s) => s.setIsZoomed);

  if (!currentImage) return null;

  return (
    <div className="w-full max-w-[1440px] flex flex-col relative pb-20">
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
          <div className="relative border-4 border-loft-black bg-black group overflow-hidden shadow-[12px_12px_0px_0px_#FEDC00]">
            <img
              src={currentImage}
              alt="Generated Scene"
              className={`w-full h-auto cursor-zoom-in transition-transform duration-500 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : ''
              } ${isProcessing ? 'opacity-50 blur-[2px]' : ''}`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            {!isZoomed && (
              <div className="absolute top-4 right-4 bg-loft-yellow border-2 border-loft-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MagnifyingGlassPlusIcon className="h-6 w-6" />
              </div>
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
            onPlayVoice={onPlayVoice}
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
