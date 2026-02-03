/**
 * Cinematic Sketch - Global state (Zustand)
 * Mirrors original App state and actions for refactor.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '@/types';
import type {
  PromptIdea,
  GalleryItem,
  TokenUsage,
  ImageModelType,
  ImageSize,
  VoiceOption,
  AmbienceType,
} from '@/types';

interface CinematicStore {
  appState: AppState;
  sketch: string | null;
  ideas: PromptIdea[];
  selectedIdea: PromptIdea | null;
  currentImage: string | null;
  gallery: GalleryItem[];
  tokenUsage: TokenUsage | null;
  loadingMsg: string;
  editPrompt: string;
  textEditInstruction: string;
  isZoomed: boolean;
  hasApiKey: boolean;
  selectedModel: ImageModelType;
  imageSize: ImageSize;
  isProcessing: boolean;
  editingIdeaId: string | null;
  blendImage: string | null;
  currentQuote: string;
  voiceName: string;
  voiceReason: string;
  currentAudioData: string | null;
  isPlayingAudio: boolean;
  bgAudioUrl: string | null;
  bgAudioName: string;
  isBgPlaying: boolean;
  ambienceType: AmbienceType;
  temperature: number;
  selectedVoice: VoiceOption;

  setAppState: (s: AppState) => void;
  setSketch: (s: string | null) => void;
  setIdeas: (i: PromptIdea[]) => void;
  setSelectedIdea: (i: PromptIdea | null) => void;
  setCurrentImage: (s: string | null) => void;
  setGallery: (g: GalleryItem[]) => void;
  addGalleryItem: (item: GalleryItem) => void;
  setTokenUsage: (u: TokenUsage | null) => void;
  setLoadingMsg: (m: string) => void;
  setEditPrompt: (p: string) => void;
  setTextEditInstruction: (s: string) => void;
  setIsZoomed: (z: boolean) => void;
  setHasApiKey: (v: boolean) => void;
  setSelectedModel: (m: ImageModelType) => void;
  setImageSize: (s: ImageSize) => void;
  setIsProcessing: (v: boolean) => void;
  setEditingIdeaId: (id: string | null) => void;
  setBlendImage: (s: string | null) => void;
  setCurrentQuote: (s: string) => void;
  setVoiceName: (s: string) => void;
  setVoiceReason: (s: string) => void;
  setCurrentAudioData: (s: string | null) => void;
  setIsPlayingAudio: (v: boolean) => void;
  setBgAudioUrl: (s: string | null) => void;
  setBgAudioName: (s: string) => void;
  setIsBgPlaying: (v: boolean) => void;
  setAmbienceType: (t: AmbienceType) => void;
  setTemperature: (t: number) => void;
  setSelectedVoice: (v: VoiceOption) => void;

  updateIdeaPrompt: (id: string, technicalPrompt: string) => void;
  resetVoiceForNewImage: () => void;
  resetBlendAndVoiceAfterEdit: () => void;
  loadFromGallery: (item: GalleryItem) => void;
}

const defaultModel: ImageModelType = 'gemini-2.5-flash-image';

export const useCinematicStore = create<CinematicStore>()(
  persist(
    (set) => ({
      appState: AppState.UPLOAD,
      sketch: null,
      ideas: [],
      selectedIdea: null,
      currentImage: null,
      gallery: [],
      tokenUsage: null,
      loadingMsg: '',
      editPrompt: '',
      textEditInstruction: '',
      isZoomed: false,
      hasApiKey: true,
      selectedModel: defaultModel,
      imageSize: '2K',
      isProcessing: false,
      editingIdeaId: null,
      blendImage: null,
      currentQuote: '',
      voiceName: '',
      voiceReason: '',
      currentAudioData: null,
      isPlayingAudio: false,
      bgAudioUrl: null,
      bgAudioName: 'None',
      isBgPlaying: false,
      ambienceType: 'narration',
      temperature: 0.5,
      selectedVoice: 'Auto',

      setAppState: (appState) => set({ appState }),
      setSketch: (sketch) => set({ sketch }),
      setIdeas: (ideas) => set({ ideas }),
      setSelectedIdea: (selectedIdea) => set({ selectedIdea }),
      setCurrentImage: (currentImage) => set({ currentImage }),
      setGallery: (gallery) => set({ gallery }),
      addGalleryItem: (item) =>
        set((state) => ({ gallery: [item, ...state.gallery] })),
      setTokenUsage: (tokenUsage) => set({ tokenUsage }),
      setLoadingMsg: (loadingMsg) => set({ loadingMsg }),
      setEditPrompt: (editPrompt) => set({ editPrompt }),
      setTextEditInstruction: (textEditInstruction) => set({ textEditInstruction }),
      setIsZoomed: (isZoomed) => set({ isZoomed }),
      setHasApiKey: (hasApiKey) => set({ hasApiKey }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setImageSize: (imageSize) => set({ imageSize }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setEditingIdeaId: (editingIdeaId) => set({ editingIdeaId }),
      setBlendImage: (blendImage) => set({ blendImage }),
      setCurrentQuote: (currentQuote) => set({ currentQuote }),
      setVoiceName: (voiceName) => set({ voiceName }),
      setVoiceReason: (voiceReason) => set({ voiceReason }),
      setCurrentAudioData: (currentAudioData) => set({ currentAudioData }),
      setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),
      setBgAudioUrl: (bgAudioUrl) => set({ bgAudioUrl }),
      setBgAudioName: (bgAudioName) => set({ bgAudioName }),
      setIsBgPlaying: (isBgPlaying) => set({ isBgPlaying }),
      setAmbienceType: (ambienceType) => set({ ambienceType }),
      setTemperature: (temperature) => set({ temperature }),
      setSelectedVoice: (selectedVoice) => set({ selectedVoice }),

      updateIdeaPrompt: (id, technicalPrompt) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, technicalPrompt } : idea
          ),
        })),

      resetVoiceForNewImage: () =>
        set({
          currentQuote: '',
          voiceName: '',
          voiceReason: '',
          currentAudioData: null,
        }),

      resetBlendAndVoiceAfterEdit: () =>
        set({
          blendImage: null,
          textEditInstruction: '',
          currentQuote: '',
          currentAudioData: null,
        }),

      loadFromGallery: (item) =>
        set({
          currentImage: item.imageUrl,
          selectedIdea: {
            id: 'gallery-restore',
            title: item.prompt,
            description: 'Restored from gallery',
            technicalPrompt: item.prompt,
          },
          editPrompt: item.prompt,
          currentQuote: item.quote || '',
          currentAudioData: item.audioData || null,
          bgAudioUrl: item.backgroundAudioUrl || null,
          bgAudioName: item.backgroundAudioUrl ? 'Restored Audio' : 'None',
          isBgPlaying: false,
          appState: AppState.EDITING,
        }),
    }),
    {
      name: 'cinematic-sketch-storage',
      partialize: (state) => ({ gallery: state.gallery }),
    }
  )
);
