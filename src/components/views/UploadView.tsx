'use client';

import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { AppState, IMAGE_MODEL_OPTIONS } from '@/types';
import type { ImageModelType } from '@/types';
import { LoftSelect } from '@/components/ui/LoftSelect';

export function UploadView() {
  const sketch = useCinematicStore((s) => s.sketch);
  const setSketch = useCinematicStore((s) => s.setSketch);
  const selectedModel = useCinematicStore((s) => s.selectedModel);
  const setSelectedModel = useCinematicStore((s) => s.setSelectedModel);
  const temperature = useCinematicStore((s) => s.temperature);
  const setTemperature = useCinematicStore((s) => s.setTemperature);
  const setAppState = useCinematicStore((s) => s.setAppState);
  const setIdeas = useCinematicStore((s) => s.setIdeas);
  const setTokenUsage = useCinematicStore((s) => s.setTokenUsage);
  const setLoadingMsg = useCinematicStore((s) => s.setLoadingMsg);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSketch(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onAnalyze = async () => {
    if (!sketch) return;
    setAppState(AppState.ANALYZING);
    setLoadingMsg('Robot is analyzing your sketch structure...');
    try {
      const base64 = sketch.split(',')[1];
      const res = await fetch('/api/cinematic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const { ideas, usage } = await res.json();
      setIdeas(ideas);
      setTokenUsage(usage);
      setAppState(AppState.SELECT_PROMPT);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setLoadingMsg(msg);
      if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        useCinematicStore.getState().setHasApiKey(false);
      }
      setTimeout(() => setAppState(AppState.UPLOAD), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white border-4 border-loft-black shadow-loft p-8 text-center flex flex-col items-center">
      <h2 className="text-3xl font-black mb-6">UPLOAD CONCEPT SKETCH</h2>
      <div className="border-4 border-dashed border-gray-300 p-12 hover:bg-yellow-50 hover:border-loft-yellow transition-colors cursor-pointer relative w-full">
        <input
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {sketch ? (
          <img
            src={sketch}
            alt="Sketch"
            className="max-h-64 mx-auto object-contain border-2 border-loft-black"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <CloudArrowUpIcon className="h-16 w-16 mb-2" />
            <p className="font-bold">DRAG & DROP or CLICK</p>
          </div>
        )}
      </div>

      <div className="mt-8 w-full max-w-xs mx-auto">
        <LoftSelect<ImageModelType>
          value={selectedModel}
          options={IMAGE_MODEL_OPTIONS}
          onChange={setSelectedModel}
        />
      </div>

      <div className="mt-6 w-full max-w-xs">
        <label className="text-xs font-black block mb-2 tracking-widest text-gray-500">
          CREATIVITY LEVEL
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={temperature * 100}
          onChange={(e) =>
            setTemperature(Number(e.target.value) / 100)
          }
          className="w-full h-2 bg-gray-300 rounded-none appearance-none cursor-pointer accent-loft-black"
        />
        <p className="text-xs text-center mt-2 font-mono font-bold text-loft-black">
          {temperature < 0.3
            ? 'Strict: Follows sketch lines closely'
            : temperature < 0.7
              ? 'Balanced: Enhances details naturally'
              : 'Creative: Reimagines the composition'}
        </p>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!sketch}
        className="mt-6 bg-loft-yellow border-4 border-loft-black px-8 py-3 font-black text-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-loft-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ANALYZE SCENE
      </button>
    </div>
  );
}
