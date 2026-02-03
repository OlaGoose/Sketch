'use client';

import {
  SparklesIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';

const STYLE_PRESETS = [
  {
    label: 'Watercolor',
    prompt:
      'Transform the image into a Watercolor painting style. Use soft washes, bleeding colors, and textured paper effects.',
  },
  {
    label: 'Ukiyo-e',
    prompt:
      'Transform the image into a Japanese Ukiyo-e woodblock print style. Use flat colors, bold outlines, and traditional patterns.',
  },
  {
    label: 'Cyberpunk',
    prompt:
      'Transform the image into a Cyberpunk style. Add neon signage, rain-slicked streets, and high-tech distinctive lighting.',
  },
  {
    label: 'Noir',
    prompt:
      'Transform the image into a Film Noir style. Use high-contrast black and white, dramatic shadows, and a moody atmosphere.',
  },
  {
    label: 'Ghibli',
    prompt:
      'Transform the image into a Studio Ghibli animation style. Use lush hand-painted backgrounds, vibrant natural colors, and specific character design aesthetics.',
  },
];

const ATMOSPHERE_PRESETS = [
  {
    label: 'Raining',
    prompt:
      'Change the weather to heavy rain. Add rain streaks, wet surface reflections, and a gloomy overcast sky.',
  },
  {
    label: 'Snowing',
    prompt:
      'Change the scene to a snowy winter day. Cover surfaces in soft white snow and add falling snowflakes.',
  },
  {
    label: 'Sunset',
    prompt:
      'Change the time of day to sunset. Use warm golden lighting, long shadows, and a colorful sky.',
  },
  {
    label: 'Foggy',
    prompt:
      'Add a thick layer of fog to the scene. Reduce visibility in the distance and create a mysterious atmosphere.',
  },
  {
    label: 'Night',
    prompt:
      'Change the time of day to night. Use cool blue moonlight tones and illuminate any artificial light sources.',
  },
];

export function MagicStudioPanel({
  isProcessing,
  onTextEdit,
}: {
  isProcessing: boolean;
  onTextEdit: () => void;
}) {
  const blendImage = useCinematicStore((s) => s.blendImage);
  const setBlendImage = useCinematicStore((s) => s.setBlendImage);
  const textEditInstruction = useCinematicStore((s) => s.textEditInstruction);
  const setTextEditInstruction = useCinematicStore((s) => s.setTextEditInstruction);
  const getTextEditInstruction = () =>
    useCinematicStore.getState().textEditInstruction;

  const handleBlendUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlendImage(reader.result as string);
        if (!textEditInstruction) {
          setTextEditInstruction(
            'Seamlessly integrate elements from the uploaded image into the main scene. Ensure perspective and lighting match.'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`bg-loft-yellow border-4 border-loft-black p-5 relative shadow-loft ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="absolute -top-4 -right-4 bg-black text-white text-xs font-black px-3 py-1 -rotate-2 border-2 border-white shadow-sm">
        NANO PRO TOOLS
      </div>

      <h3 className="font-black text-xl mb-4 flex items-center gap-2 text-black">
        <SparklesIcon className="h-6 w-6" />
        MAGIC STUDIO
      </h3>

      <div className="mb-4 bg-white/50 border-2 border-dashed border-black p-2 relative text-center hover:bg-white transition-colors">
        {blendImage ? (
          <div className="relative">
            <img
              src={blendImage}
              alt="Blend"
              className="h-20 mx-auto object-cover border border-black"
            />
            <button
              onClick={() => {
                setBlendImage(null);
                setTextEditInstruction('');
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border border-black hover:bg-red-600"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-2 cursor-pointer">
            <PhotoIcon className="h-6 w-6 text-black opacity-50" />
            <span className="text-[10px] font-bold text-black uppercase mt-1">
              Blend Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBlendUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="relative mb-4">
        <textarea
          value={textEditInstruction}
          onChange={(e) => setTextEditInstruction(e.target.value)}
          placeholder={
            blendImage
              ? 'Describe how to blend this image...'
              : "Describe the change (e.g. 'Add a cat', 'Make it cyberpunk')..."
          }
          className="w-full h-32 border-2 border-black p-3 text-xs font-medium outline-none resize-none focus:bg-white bg-white/80 transition-colors"
        />
        <button
          onClick={onTextEdit}
          disabled={!textEditInstruction}
          className="absolute bottom-2 right-2 bg-black text-white px-4 py-1 text-xs font-bold hover:bg-gray-800 disabled:opacity-50"
        >
          GENERATE
        </button>
      </div>

      <div className="space-y-3">
        <div className="bg-white border-2 border-black p-2">
          <p className="text-[10px] font-black text-gray-400 mb-2 tracking-wider">
            VISUAL STYLE
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => setTextEditInstruction(item.prompt)}
                className="text-xs border border-gray-300 px-2 py-1 hover:bg-black hover:text-white hover:border-black transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-2">
          <p className="text-[10px] font-black text-gray-400 mb-2 tracking-wider">
            ATMOSPHERE
          </p>
          <div className="flex flex-wrap gap-2">
            {ATMOSPHERE_PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => setTextEditInstruction(item.prompt)}
                className="text-xs border border-gray-300 px-2 py-1 hover:bg-black hover:text-white hover:border-black transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-2">
          <p className="text-[10px] font-black text-gray-400 mb-2 tracking-wider">
            OBJECTS
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setTextEditInstruction(
                  (getTextEditInstruction() ? getTextEditInstruction() + ' ' : '') +
                    'Add a [OBJECT] to the scene. Ensure it matches the perspective, lighting, and style.'
                )
              }
              className="text-xs font-bold bg-gray-100 px-2 py-1 border-b-2 border-gray-300 hover:border-black"
            >
              Add...
            </button>
            <button
              onClick={() =>
                setTextEditInstruction(
                  (getTextEditInstruction() ? getTextEditInstruction() + ' ' : '') +
                    'Remove the [OBJECT] from the scene. Inpaint the background naturally.'
                )
              }
              className="text-xs font-bold bg-gray-100 px-2 py-1 border-b-2 border-gray-300 hover:border-black"
            >
              Remove...
            </button>
            <button
              onClick={() =>
                setTextEditInstruction(
                  (getTextEditInstruction() ? getTextEditInstruction() + ' ' : '') +
                    "Ensure the output strictly maintains the original image's artistic style, brushwork, and color palette."
                )
              }
              className="text-xs font-bold bg-yellow-100 px-2 py-1 border-b-2 border-yellow-300 hover:border-black hover:bg-yellow-200"
            >
              Keep Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
