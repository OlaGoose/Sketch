'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { ImageModelType, ImageSize } from '@/types';
import { IMAGE_MODEL_OPTIONS, IMAGE_SIZE_OPTIONS } from '@/types';
import { LoftSelect } from '@/components/ui/LoftSelect';

export function RegeneratePanel({
  isProcessing,
  onRegenerate,
}: {
  isProcessing: boolean;
  onRegenerate: () => void;
}) {
  const editPrompt = useCinematicStore((s) => s.editPrompt);
  const setEditPrompt = useCinematicStore((s) => s.setEditPrompt);
  const selectedModel = useCinematicStore((s) => s.selectedModel);
  const setSelectedModel = useCinematicStore((s) => s.setSelectedModel);
  const imageSize = useCinematicStore((s) => s.imageSize);
  const setImageSize = useCinematicStore((s) => s.setImageSize);
  const selectedIdea = useCinematicStore((s) => s.selectedIdea);
  const isPro = selectedModel === 'gemini-3-pro-image-preview';
  const showSize = isPro || selectedModel === 'doubao';
  const sizeOptions =
    selectedModel === 'doubao'
      ? IMAGE_SIZE_OPTIONS.filter((o) => o.value !== '4K')
      : IMAGE_SIZE_OPTIONS;

  return (
    <div
      className={`bg-white border-4 border-loft-black p-4 ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <h3 className="font-black text-lg mb-2 flex items-center gap-2">
        <ArrowPathIcon className="h-5 w-5" /> RE-GENERATE
      </h3>
      <textarea
        value={editPrompt}
        onChange={(e) => setEditPrompt(e.target.value)}
        className="w-full h-20 border-2 border-gray-200 p-2 text-sm font-mono mb-2 focus:border-loft-yellow outline-none"
      />
      <div className="mb-2 grid grid-cols-1 gap-2">
        <LoftSelect<ImageModelType>
          value={selectedModel}
          options={IMAGE_MODEL_OPTIONS}
          onChange={setSelectedModel}
          compact
        />
        {showSize && (
          <LoftSelect<ImageSize>
            value={selectedModel === 'doubao' && imageSize === '4K' ? '2K' : imageSize}
            options={sizeOptions}
            onChange={setImageSize}
            compact
          />
        )}
      </div>
      <button
        onClick={onRegenerate}
        disabled={!selectedIdea}
        className="w-full bg-gray-200 border-2 border-black py-2 font-bold hover:bg-loft-yellow transition-colors"
      >
        UPDATE SCENE
      </button>
    </div>
  );
}
