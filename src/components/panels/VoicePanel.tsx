'use client';

import { SpeakerWaveIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { VoiceOption } from '@/types';
import { VOICE_OPTIONS } from '@/types';
import { LoftSelect } from '@/components/ui/LoftSelect';

const VOICE_SELECT_OPTIONS = VOICE_OPTIONS.map((v) => ({
  value: v,
  label: v === 'Auto' ? 'Auto (AI Cast)' : v,
}));

export function VoicePanel({
  isProcessing,
  onGenerateSpeech,
  onPlayVoice,
}: {
  isProcessing: boolean;
  onGenerateSpeech: () => void;
  onPlayVoice: () => void;
}) {
  const selectedVoice = useCinematicStore((s) => s.selectedVoice);
  const setSelectedVoice = useCinematicStore((s) => s.setSelectedVoice);
  const currentQuote = useCinematicStore((s) => s.currentQuote);
  const setCurrentQuote = useCinematicStore((s) => s.setCurrentQuote);
  const voiceName = useCinematicStore((s) => s.voiceName);
  const voiceReason = useCinematicStore((s) => s.voiceReason);
  const currentAudioData = useCinematicStore((s) => s.currentAudioData);
  const setCurrentAudioData = useCinematicStore((s) => s.setCurrentAudioData);
  const isPlayingAudio = useCinematicStore((s) => s.isPlayingAudio);

  return (
    <div
      className={`bg-white border-4 border-loft-black p-4 relative ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <h3 className="font-black text-lg mb-2 flex items-center gap-2">
        <SpeakerWaveIcon className="h-5 w-5" /> CHARACTER VOICE
      </h3>

      <div className="mb-2">
        <LoftSelect<VoiceOption>
          value={selectedVoice}
          options={VOICE_SELECT_OPTIONS}
          onChange={setSelectedVoice}
          compact
        />
      </div>

      <textarea
        value={currentQuote}
        onChange={(e) => setCurrentQuote(e.target.value)}
        placeholder="Enter dialogue..."
        className="w-full h-16 border-2 border-gray-200 p-2 text-sm font-display italic mb-2 focus:border-loft-yellow outline-none"
      />
      {voiceName && (
        <p className="text-xs text-gray-500 mb-2">
          Casted: <span className="font-bold">{voiceName}</span> ({voiceReason})
        </p>
      )}

      <div className="flex gap-2">
        {!currentAudioData ? (
          <button
            onClick={onGenerateSpeech}
            disabled={!currentQuote}
            className="flex-grow bg-loft-yellow border-2 border-loft-black font-bold text-sm hover:bg-loft-black hover:text-loft-yellow transition-colors disabled:opacity-50"
          >
            GENERATE SPEECH
          </button>
        ) : (
          <button
            onClick={onPlayVoice}
            disabled={isPlayingAudio}
            className={`flex-grow flex items-center justify-center gap-2 border-2 border-loft-black font-bold text-sm transition-colors ${
              isPlayingAudio ? 'bg-gray-300' : 'bg-green-400 hover:bg-green-500'
            }`}
          >
            <PlayCircleIcon className="h-5 w-5" />{' '}
            {isPlayingAudio ? 'PLAYING...' : 'PLAY VOICE'}
          </button>
        )}
        {currentAudioData && (
          <button
            onClick={() => setCurrentAudioData(null)}
            className="p-2 border-2 border-gray-200 hover:bg-gray-100"
            title="Reset Audio"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
