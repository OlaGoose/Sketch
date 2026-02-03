'use client';

import { FilmIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { PromptIdea, ImageModelType, ImageSize } from '@/types';
import { IMAGE_MODEL_OPTIONS, IMAGE_SIZE_OPTIONS } from '@/types';
import { LoftSelect } from '@/components/ui/LoftSelect';

interface SelectPromptViewProps {
  onGenerate: (idea: PromptIdea) => void;
}

export function SelectPromptView({ onGenerate }: SelectPromptViewProps) {
  const ideas = useCinematicStore((s) => s.ideas);
  const selectedModel = useCinematicStore((s) => s.selectedModel);
  const setSelectedModel = useCinematicStore((s) => s.setSelectedModel);
  const imageSize = useCinematicStore((s) => s.imageSize);
  const setImageSize = useCinematicStore((s) => s.setImageSize);
  const editingIdeaId = useCinematicStore((s) => s.editingIdeaId);
  const setEditingIdeaId = useCinematicStore((s) => s.setEditingIdeaId);
  const updateIdeaPrompt = useCinematicStore((s) => s.updateIdeaPrompt);
  const isPro = selectedModel === 'gemini-3-pro-image-preview';
  const showSize = isPro || selectedModel === 'doubao';
  const sizeOptions =
    selectedModel === 'doubao'
      ? IMAGE_SIZE_OPTIONS.filter((o) => o.value !== '4K')
      : IMAGE_SIZE_OPTIONS;

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-white border-2 border-loft-black p-4">
        <h2 className="text-2xl font-black">CHOOSE DIRECTION</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-sm uppercase tracking-wider">Model:</span>
          <LoftSelect<ImageModelType>
            value={selectedModel}
            options={IMAGE_MODEL_OPTIONS}
            onChange={setSelectedModel}
            compact
            className="min-w-[200px]"
          />
          {showSize && (
            <>
              <span className="font-bold text-sm uppercase tracking-wider">Size:</span>
              <LoftSelect<ImageSize>
                value={selectedModel === 'doubao' && imageSize === '4K' ? '2K' : imageSize}
                options={sizeOptions}
                onChange={setImageSize}
                compact
                className="min-w-[80px]"
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="bg-white border-4 border-loft-black p-6 shadow-loft flex flex-col h-full hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-loft-black text-white px-3 py-1 text-xs font-bold w-max">
                OPTION {idea.id.split('-')[1]}
              </div>
              <button
                onClick={() =>
                  setEditingIdeaId(editingIdeaId === idea.id ? null : idea.id)
                }
                className="text-loft-black hover:text-loft-yellow p-1"
                title="Edit Prompt"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-2xl font-black mb-2 leading-none">
              {idea.title}
            </h3>

            {editingIdeaId === idea.id ? (
              <textarea
                value={idea.technicalPrompt}
                onChange={(e) =>
                  updateIdeaPrompt(idea.id, e.target.value)
                }
                className="flex-grow text-sm font-mono border-2 border-black p-2 mb-6 bg-yellow-50 resize-none outline-none focus:border-loft-yellow"
              />
            ) : (
              <p className="text-gray-600 mb-6 flex-grow text-sm font-medium">
                {idea.description}
              </p>
            )}

            <button
              onClick={() => onGenerate(idea)}
              className="w-full bg-loft-yellow border-2 border-loft-black py-3 font-black flex items-center justify-center gap-2 hover:bg-black hover:text-loft-yellow transition-colors"
            >
              <FilmIcon className="h-5 w-5" />{' '}
              {editingIdeaId === idea.id ? 'GENERATE CUSTOM' : 'ACTION!'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
