/**
 * Cinematic Sketch - Global state (Zustand)
 * Mirrors original App state and actions for refactor.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '@/types';
import { indexedDbStorage } from '@/lib/db/storage-adapter';
import type {
  PromptIdea,
  GalleryItem,
  TokenUsage,
  ImageModelType,
  ImageSize,
  VoiceOption,
  AmbienceType,
  VoiceClip,
  AudioPlayOptions,
  Storybook,
  StorybookPage,
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
  voiceClips: VoiceClip[];
  isPlayingAudio: boolean;
  playingClipId: string | null;
  bgAudioUrl: string | null;
  bgAudioName: string;
  isBgPlaying: boolean;
  bgVolume: number;
  bgPlayCount: number;
  bgLoop: boolean;
  ambienceType: AmbienceType;
  temperature: number;
  selectedVoice: VoiceOption;
  
  // Storybook state
  storybooks: Storybook[];
  currentStorybookId: string | null;

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
  setIsPlayingAudio: (v: boolean) => void;
  setPlayingClipId: (id: string | null) => void;
  setBgAudioUrl: (s: string | null) => void;
  setBgAudioName: (s: string) => void;
  setIsBgPlaying: (v: boolean) => void;
  setBgVolume: (v: number) => void;
  setBgPlayCount: (n: number) => void;
  setBgLoop: (v: boolean) => void;
  setAmbienceType: (t: AmbienceType) => void;
  addVoiceClip: (clip: VoiceClip) => void;
  removeVoiceClip: (id: string) => void;
  updateVoiceClip: (id: string, patch: Partial<VoiceClip>) => void;
  setVoiceClipPosition: (id: string, position: { x: number; y: number }) => void;
  setTemperature: (t: number) => void;
  setSelectedVoice: (v: VoiceOption) => void;

  updateIdeaPrompt: (id: string, technicalPrompt: string) => void;
  resetVoiceForNewImage: () => void;
  resetBlendAndVoiceAfterEdit: () => void;
  loadFromGallery: (item: GalleryItem) => void;
  
  // Storybook actions
  setStorybooks: (storybooks: Storybook[]) => void;
  addStorybook: (storybook: Storybook) => void;
  updateStorybook: (id: string, patch: Partial<Storybook>) => void;
  removeStorybook: (id: string) => void;
  setCurrentStorybookId: (id: string | null) => void;
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
      voiceClips: [],
      isPlayingAudio: false,
      playingClipId: null,
      bgAudioUrl: null,
      bgAudioName: 'None',
      isBgPlaying: false,
      bgVolume: 1,
      bgPlayCount: 1,
      bgLoop: true,
      ambienceType: 'narration',
      temperature: 0.5,
      selectedVoice: 'Auto',
      storybooks: [],
      currentStorybookId: null,

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
      setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),
      setPlayingClipId: (playingClipId) => set({ playingClipId }),
      setBgAudioUrl: (bgAudioUrl) => set({ bgAudioUrl }),
      setBgAudioName: (bgAudioName) => set({ bgAudioName }),
      setIsBgPlaying: (isBgPlaying) => set({ isBgPlaying }),
      setBgVolume: (bgVolume) => set({ bgVolume }),
      setBgPlayCount: (bgPlayCount) => set({ bgPlayCount }),
      setBgLoop: (bgLoop) => set({ bgLoop }),
      setAmbienceType: (ambienceType) => set({ ambienceType }),
      addVoiceClip: (clip) =>
        set((state) => ({ voiceClips: [...state.voiceClips, clip] })),
      removeVoiceClip: (id) =>
        set((state) => ({
          voiceClips: state.voiceClips.filter((c) => c.id !== id),
        })),
      updateVoiceClip: (id, patch) =>
        set((state) => ({
          voiceClips: state.voiceClips.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),
      setVoiceClipPosition: (id, position) =>
        set((state) => ({
          voiceClips: state.voiceClips.map((c) =>
            c.id === id ? { ...c, position } : c
          ),
        })),
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
          voiceClips: [],
          playingClipId: null,
        }),

      resetBlendAndVoiceAfterEdit: () =>
        set({
          blendImage: null,
          textEditInstruction: '',
          currentQuote: '',
          voiceClips: [],
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
          voiceClips: item.voiceClips ?? (item.audioData
            ? [{
                id: `legacy-${item.id}`,
                audioSrc: `pcm-base64:${item.audioData}`,
                volume: 1,
                playCount: 1,
                loop: false,
              }]
            : []),
          bgAudioUrl: item.backgroundAudioUrl || null,
          bgAudioName: item.backgroundAudioUrl ? 'Restored Audio' : 'None',
          isBgPlaying: false,
          bgVolume: item.bgAudioOptions?.volume ?? 1,
          bgPlayCount: item.bgAudioOptions?.playCount ?? 1,
          bgLoop: item.bgAudioOptions?.loop ?? true,
          appState: AppState.EDITING,
        }),
      
      // Storybook actions
      setStorybooks: (storybooks) => set({ storybooks }),
      addStorybook: (storybook) =>
        set((state) => ({ storybooks: [storybook, ...state.storybooks] })),
      updateStorybook: (id, patch) =>
        set((state) => ({
          storybooks: state.storybooks.map((sb) =>
            sb.id === id ? { ...sb, ...patch } : sb
          ),
        })),
      removeStorybook: (id) =>
        set((state) => ({
          storybooks: state.storybooks.filter((sb) => sb.id !== id),
        })),
      setCurrentStorybookId: (currentStorybookId) => set({ currentStorybookId }),
    }),
    {
      name: 'cinematic-sketch-storage',
      storage: indexedDbStorage,
      partialize: (state) => ({ gallery: state.gallery }),
    }
  )
);
