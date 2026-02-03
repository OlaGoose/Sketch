/**
 * Cinematic Sketch - Domain types
 */

export interface PromptIdea {
  id: string;
  title: string;
  description: string;
  technicalPrompt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  quote?: string;
  audioData?: string;
  backgroundAudioUrl?: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  SELECT_PROMPT = 'SELECT_PROMPT',
  GENERATING = 'GENERATING',
  EDITING = 'EDITING',
  GALLERY = 'GALLERY',
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: string;
}

export type ImageModelType =
  | 'doubao'
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.5-flash-image';

/** Output resolution for image generation. 4K only supported by Gemini 3 Pro Image. */
export type ImageSize = '1K' | '2K' | '4K';

/** Options for image model dropdown (label shown in UI). */
export const IMAGE_MODEL_OPTIONS: { value: ImageModelType; label: string }[] = [
  { value: 'doubao', label: 'Doubao' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro (quality)' },
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash (fast)' },
];

export const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const VOICE_OPTIONS = [
  'Auto',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Zephyr',
] as const;

export type VoiceOption = (typeof VOICE_OPTIONS)[number];

export type AmbienceType = 'narration' | 'music';
