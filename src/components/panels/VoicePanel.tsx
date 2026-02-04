'use client';

import { useRef, useCallback, useState } from 'react';
import {
  SpeakerWaveIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ArrowUpTrayIcon,
  MicrophoneIcon,
  TrashIcon,
  HandRaisedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import type { VoiceOption, VoiceClip } from '@/types';
import { VOICE_OPTIONS } from '@/types';
import { LoftSelect } from '@/components/ui/LoftSelect';

const VOICE_SELECT_OPTIONS = VOICE_OPTIONS.map((v) => ({
  value: v,
  label: v === 'Auto' ? 'Auto (AI Cast)' : v,
}));

function defaultClip(overrides: Partial<VoiceClip>): VoiceClip {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    audioSrc: '',
    volume: 1,
    playCount: 1,
    loop: false,
    ...overrides,
  };
}

export function VoicePanel({
  isProcessing,
  onGenerateSpeech,
  onPlayClip,
  onStopClip,
  playingClipId,
}: {
  isProcessing: boolean;
  onGenerateSpeech: () => void;
  onPlayClip: (clip: VoiceClip) => void;
  onStopClip: () => void;
  playingClipId: string | null;
}) {
  const selectedVoice = useCinematicStore((s) => s.selectedVoice);
  const setSelectedVoice = useCinematicStore((s) => s.setSelectedVoice);
  const currentQuote = useCinematicStore((s) => s.currentQuote);
  const setCurrentQuote = useCinematicStore((s) => s.setCurrentQuote);
  const voiceName = useCinematicStore((s) => s.voiceName);
  const voiceReason = useCinematicStore((s) => s.voiceReason);
  const voiceClips = useCinematicStore((s) => s.voiceClips);
  const addVoiceClip = useCinematicStore((s) => s.addVoiceClip);
  const removeVoiceClip = useCinematicStore((s) => s.removeVoiceClip);
  const updateVoiceClip = useCinematicStore((s) => s.updateVoiceClip);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      addVoiceClip(
        defaultClip({
          name: file.name,
          audioSrc: url,
        })
      );
      e.target.value = '';
    },
    [addVoiceClip]
  );

  const handleStartRecord = useCallback(() => {
    chunksRef.current = [];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (ev) => {
          if (ev.data.size) chunksRef.current.push(ev.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          setIsRecording(false);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          addVoiceClip(
            defaultClip({ name: 'Recording', audioSrc: url })
          );
        };
        recorder.start();
        setIsRecording(true);
      })
      .catch(console.error);
  }, [addVoiceClip]);

  const handleStopRecord = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

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

      <div className="flex gap-2 mb-2">
        <button
          onClick={onGenerateSpeech}
          disabled={!currentQuote}
          className="flex-grow bg-loft-yellow border-2 border-loft-black font-bold text-sm hover:bg-loft-black hover:text-loft-yellow transition-colors disabled:opacity-50"
        >
          GENERATE SPEECH
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <label className="flex-1 flex items-center justify-center gap-1 border-2 border-dashed border-gray-300 p-2 hover:bg-gray-50 cursor-pointer text-xs font-bold">
          <ArrowUpTrayIcon className="h-4 w-4" /> UPLOAD MP3/WAV
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp3,.mp3,.wav,audio/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
        {!isRecording ? (
          <button
            type="button"
            onClick={handleStartRecord}
            className="flex-1 flex items-center justify-center gap-1 border-2 border-loft-black p-2 text-xs font-bold hover:bg-loft-yellow"
          >
            <MicrophoneIcon className="h-4 w-4" /> RECORD
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopRecord}
            className="flex-1 flex items-center justify-center gap-1 border-2 border-red-500 bg-red-100 p-2 text-xs font-bold text-red-700"
          >
            <MicrophoneSolidIcon className="h-4 w-4" /> STOP
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-2">Drag clip to image to pin. Tap on image to play.</p>

      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {voiceClips.map((clip) => (
          <li
            key={clip.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/voice-clip-id', clip.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="bg-gray-100 border-l-4 border-loft-yellow p-2 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1">
              <HandRaisedIcon className="h-4 w-4 text-gray-400 flex-shrink-0 cursor-grab" />
              <input
                type="text"
                value={clip.name ?? ''}
                onChange={(e) => updateVoiceClip(clip.id, { name: e.target.value || undefined })}
                placeholder="Voice clip"
                className="text-xs font-mono truncate flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0"
              />
              <button
                type="button"
                onClick={() =>
                  playingClipId === clip.id ? onStopClip() : onPlayClip(clip)
                }
                className={`p-1 ${playingClipId === clip.id ? 'bg-gray-300' : 'hover:bg-green-300'}`}
                title={playingClipId === clip.id ? 'Pause' : 'Play'}
              >
                {playingClipId === clip.id ? (
                  <PauseCircleIcon className="h-4 w-4" />
                ) : (
                  <PlayCircleIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateVoiceClip(clip.id, { markerHidden: !clip.markerHidden })
                }
                className={`p-1 ${clip.markerHidden ? 'text-gray-400' : 'hover:bg-gray-200'}`}
                title={clip.markerHidden ? 'Show on image' : 'Hide on image'}
              >
                {clip.markerHidden ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removeVoiceClip(clip.id)}
                className="p-1 hover:bg-red-100"
                title="Remove"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1">
                Vol
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={clip.volume}
                  onChange={(e) =>
                    updateVoiceClip(clip.id, { volume: parseFloat(e.target.value) })
                  }
                  className="w-14"
                />
              </label>
              <label className="flex items-center gap-1">
                Count
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={clip.playCount}
                  onChange={(e) =>
                    updateVoiceClip(clip.id, {
                      playCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-10 border border-gray-200 px-1"
                />
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={clip.loop}
                  onChange={(e) => updateVoiceClip(clip.id, { loop: e.target.checked })}
                />
                Loop
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
