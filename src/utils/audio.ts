/**
 * Client-side audio helpers for Cinematic Sketch
 * Decode PCM from API and play; create WAV blob for <audio> playback.
 */

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Decode PCM base64 (from TTS API) to AudioBuffer for Web Audio playback. */
export async function decodeAudioData(
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const bytes = decodeBase64(base64Data);
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] =
        dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/** Create WAV Blob from raw PCM base64 (for <audio src> or background ambience). */
export function createWavBlob(base64Data: string): Blob {
  const bytes = decodeBase64(base64Data);
  const len = bytes.length;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  const dataCopy = new Uint8Array(bytes);
  return new Blob([wavHeader, dataCopy], { type: 'audio/wav' });
}

const PCM_PREFIX = 'pcm-base64:';

export function isPcmBase64(audioSrc: string): boolean {
  return audioSrc.startsWith(PCM_PREFIX);
}

export function getPcmBase64(audioSrc: string): string | null {
  return isPcmBase64(audioSrc) ? audioSrc.slice(PCM_PREFIX.length) : null;
}

export interface PlayOptions {
  volume: number;
  playCount: number;
  loop: boolean;
}

/** Play a voice clip (URL or pcm-base64) with volume/playCount/loop. Returns stop function. */
export function playVoiceClip(
  audioSrc: string,
  options: PlayOptions,
  ctx: AudioContext,
  onPlayingChange: (playing: boolean) => void
): () => void {
  const pcm = getPcmBase64(audioSrc);
  const state = { stopped: false };
  let currentSource: AudioBufferSourceNode | null = null;

  const stop = () => {
    state.stopped = true;
    if (currentSource) try { currentSource.stop(); } catch { /* noop */ }
    onPlayingChange(false);
  };

  const playOne = (buffer: AudioBuffer): Promise<void> =>
    new Promise((resolve) => {
      if (state.stopped) {
        resolve();
        return;
      }
      const source = ctx.createBufferSource();
      currentSource = source;
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, options.volume));
      source.connect(gain);
      gain.connect(ctx.destination);
      source.onended = () => {
        currentSource = null;
        resolve();
      };
      source.start();
    });

  const run = async () => {
    onPlayingChange(true);
    try {
      let buffer: AudioBuffer;
      if (pcm) {
        buffer = await decodeAudioData(pcm, ctx);
      } else {
        const res = await fetch(audioSrc);
        const arr = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(arr);
      }
      if (state.stopped) return;
      let count = 0;
      const max = options.loop ? Infinity : Math.max(1, options.playCount);
      while (count < max && !state.stopped) {
        await playOne(buffer);
        count++;
      }
    } finally {
      if (!state.stopped) onPlayingChange(false);
    }
  };

  run();
  return stop;
}
