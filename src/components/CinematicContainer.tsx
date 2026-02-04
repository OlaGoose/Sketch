'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCinematicStore } from '@/lib/store/cinematic-store';
import { AppState } from '@/types';
import type { PromptIdea, StorybookPage } from '@/types';
import { playVoiceClip } from '@/utils/audio';
import type { VoiceClip } from '@/types';
import { Header } from './Header';
import { ParticleBackground } from './ParticleBackground';
import { UploadView } from './views/UploadView';
import { LoadingView } from './views/LoadingView';
import { SelectPromptView } from './views/SelectPromptView';
import { EditingView } from './views/EditingView';
import { GalleryView } from './views/GalleryView';
import { AccessRequiredView } from './views/AccessRequiredView';
import { ZoomModal } from './ZoomModal';
import { useDialog } from './DialogProvider';
import { getStorybookById, saveStorybook, savePage } from '@/lib/db/cinematic-db';

interface CinematicContainerProps {
  storybookId?: string;
}

export function CinematicContainer({ storybookId }: CinematicContainerProps) {
  const router = useRouter();
  const dialog = useDialog();
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const appState = useCinematicStore((s) => s.appState);
  const hasApiKey = useCinematicStore((s) => s.hasApiKey);
  const isProcessing = useCinematicStore((s) => s.isProcessing);
  const loadingMsg = useCinematicStore((s) => s.loadingMsg);
  const sketch = useCinematicStore((s) => s.sketch);
  const selectedModel = useCinematicStore((s) => s.selectedModel);
  const imageSize = useCinematicStore((s) => s.imageSize);
  const selectedIdea = useCinematicStore((s) => s.selectedIdea);
  const editPrompt = useCinematicStore((s) => s.editPrompt);
  const currentImage = useCinematicStore((s) => s.currentImage);
  const textEditInstruction = useCinematicStore((s) => s.textEditInstruction);
  const blendImage = useCinematicStore((s) => s.blendImage);
  const currentQuote = useCinematicStore((s) => s.currentQuote);
  const selectedVoice = useCinematicStore((s) => s.selectedVoice);
  const ambienceType = useCinematicStore((s) => s.ambienceType);
  const temperature = useCinematicStore((s) => s.temperature);

  const setAppState = useCinematicStore((s) => s.setAppState);
  const setSelectedIdea = useCinematicStore((s) => s.setSelectedIdea);
  const setCurrentImage = useCinematicStore((s) => s.setCurrentImage);
  const setTokenUsage = useCinematicStore((s) => s.setTokenUsage);
  const setEditPrompt = useCinematicStore((s) => s.setEditPrompt);
  const setLoadingMsg = useCinematicStore((s) => s.setLoadingMsg);
  const setIsProcessing = useCinematicStore((s) => s.setIsProcessing);
  const resetVoiceForNewImage = useCinematicStore(
    (s) => s.resetVoiceForNewImage
  );
  const setBlendImage = useCinematicStore((s) => s.setBlendImage);
  const setVoiceName = useCinematicStore((s) => s.setVoiceName);
  const setVoiceReason = useCinematicStore((s) => s.setVoiceReason);
  const addVoiceClip = useCinematicStore((s) => s.addVoiceClip);
  const setIsPlayingAudio = useCinematicStore((s) => s.setIsPlayingAudio);
  const setBgAudioUrl = useCinematicStore((s) => s.setBgAudioUrl);
  const setBgAudioName = useCinematicStore((s) => s.setBgAudioName);
  const addGalleryItem = useCinematicStore((s) => s.addGalleryItem);
  const resetBlendAndVoiceAfterEdit = useCinematicStore(
    (s) => s.resetBlendAndVoiceAfterEdit
  );

  const handleGenerate = useCallback(
    async (idea: PromptIdea, customPrompt?: string) => {
      setSelectedIdea(idea);
      if (appState === AppState.EDITING) {
        setIsProcessing(true);
      } else {
        setAppState(AppState.GENERATING);
      }
      setLoadingMsg(
        selectedModel === 'doubao'
          ? 'Doubao is generating your scene...'
          : selectedModel === 'gemini-3-pro-image-preview'
            ? `Gemini 3 Pro is filming in ${imageSize}...`
            : 'Gemini Flash is sketching quickly...'
      );
      const finalPrompt = customPrompt ?? idea.technicalPrompt;
      try {
        const res = await fetch('/api/cinematic/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            model: selectedModel,
            size: imageSize,
            referenceImageBase64: sketch ? sketch.split(',')[1] : undefined,
            temperature,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || res.statusText);
        }
        const { imageUrl, usage } = await res.json();
        setCurrentImage(imageUrl);
        setTokenUsage(usage);
        setEditPrompt(finalPrompt);
        resetVoiceForNewImage();
        setBlendImage(null);
        setIsProcessing(false);
        setAppState(AppState.EDITING);
      } catch (err) {
        setLoadingMsg(err instanceof Error ? err.message : 'Generation failed.');
        setIsProcessing(false);
        if (appState !== AppState.EDITING) {
          setTimeout(() => setAppState(AppState.SELECT_PROMPT), 2000);
        }
      }
    },
    [
      appState,
      selectedModel,
      imageSize,
      sketch,
      temperature,
      setSelectedIdea,
      setAppState,
      setLoadingMsg,
      setIsProcessing,
      setCurrentImage,
      setTokenUsage,
      setEditPrompt,
      resetVoiceForNewImage,
      setBlendImage,
    ]
  );

  const handleTextEdit = useCallback(async () => {
    if (!currentImage || !textEditInstruction) return;
    setIsProcessing(true);
    setLoadingMsg('Robot is applying edits...');
    try {
      const res = await fetch('/api/cinematic/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage,
          instruction: textEditInstruction,
          blendImageBase64: blendImage ? blendImage.split(',')[1] : undefined,
          model: selectedModel,
          size: imageSize,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const { imageUrl, usage } = await res.json();
      setCurrentImage(imageUrl);
      setTokenUsage(usage);
      resetBlendAndVoiceAfterEdit();
      setIsProcessing(false);
    } catch (err) {
      setLoadingMsg(err instanceof Error ? err.message : 'Edit failed.');
      setIsProcessing(false);
    }
  }, [
    currentImage,
    textEditInstruction,
    blendImage,
    setIsProcessing,
    setLoadingMsg,
    setCurrentImage,
    setTokenUsage,
    resetBlendAndVoiceAfterEdit,
  ]);

  const handleRegenerate = useCallback(() => {
    if (selectedIdea) handleGenerate(selectedIdea, editPrompt);
  }, [selectedIdea, editPrompt, handleGenerate]);

  const handleGenerateSpeech = useCallback(async () => {
    if (!currentImage || !currentQuote) return;
    setIsProcessing(true);
    setLoadingMsg('Casting the perfect voice...');
    try {
      let targetVoice = selectedVoice;
      if (selectedVoice === 'Auto') {
        const cleanImg = currentImage.replace(
          /^data:image\/(png|jpeg|jpg);base64,/,
          ''
        );
        const recRes = await fetch('/api/cinematic/voice/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: cleanImg,
            text: currentQuote,
          }),
        });
        if (!recRes.ok) throw new Error('Voice recommendation failed');
        const rec = await recRes.json();
        targetVoice = rec.voiceName;
        setVoiceName(rec.voiceName);
        setVoiceReason(rec.reason ?? 'Manual');
      } else {
        setVoiceName(selectedVoice);
        setVoiceReason('Manual Selection');
      }
      setLoadingMsg(`Recording with ${targetVoice}...`);
      const speechRes = await fetch('/api/cinematic/voice/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentQuote, voiceName: targetVoice }),
      });
      if (!speechRes.ok) throw new Error('Speech generation failed');
      const { audioData, usage } = await speechRes.json();
      addVoiceClip({
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: currentQuote.slice(0, 30) || 'Speech',
        audioSrc: `pcm-base64:${audioData}`,
        volume: 1,
        playCount: 1,
        loop: false,
      });
      setTokenUsage(usage);
      setIsProcessing(false);
    } catch (err) {
      setLoadingMsg(
        err instanceof Error ? err.message : 'Voice production failed.'
      );
      setIsProcessing(false);
    }
  }, [
    currentImage,
    currentQuote,
    selectedVoice,
    setIsProcessing,
    setLoadingMsg,
    setVoiceName,
    setVoiceReason,
    addVoiceClip,
    setTokenUsage,
  ]);

  const voiceStopRef = useRef<(() => void) | null>(null);
  const setPlayingClipId = useCinematicStore((s) => s.setPlayingClipId);

  const handlePlayClip = useCallback(
    (clip: VoiceClip) => {
      if (!clip.audioSrc) return;
      if (voiceStopRef.current) {
        voiceStopRef.current();
        voiceStopRef.current = null;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const onPlayingChange = (playing: boolean) => {
        useCinematicStore.getState().setIsPlayingAudio(playing);
        if (!playing) useCinematicStore.getState().setPlayingClipId(null);
      };
      setPlayingClipId(clip.id);
      voiceStopRef.current = playVoiceClip(
        clip.audioSrc,
        { volume: clip.volume, playCount: clip.playCount, loop: clip.loop },
        ctx,
        onPlayingChange
      );
    },
    [setPlayingClipId]
  );

  const handleStopClip = useCallback(() => {
    if (voiceStopRef.current) {
      voiceStopRef.current();
      voiceStopRef.current = null;
    }
    setPlayingClipId(null);
    useCinematicStore.getState().setIsPlayingAudio(false);
  }, [setPlayingClipId]);

  const handleGenerateAmbience = useCallback(async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    setLoadingMsg('Analyzing scene atmosphere...');
    try {
      const cleanImg = currentImage.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ''
      );
      const descRes = await fetch('/api/cinematic/ambience/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: cleanImg }),
      });
      if (!descRes.ok) throw new Error('Ambience description failed');
      const { description } = await descRes.json();

      if (ambienceType === 'music') {
        setLoadingMsg('Synthesizing soundscape...');
        const audioRes = await fetch('/api/cinematic/ambience/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
        });
        if (!audioRes.ok) throw new Error('Ambience audio failed');
        const { audioDataBase64Wav } = await audioRes.json();
        const wavUrl = `data:audio/wav;base64,${audioDataBase64Wav}`;
        setBgAudioUrl(wavUrl);
        setBgAudioName('AI Soundscape');
      } else {
        setLoadingMsg('Narrating atmosphere...');
        const speechRes = await fetch('/api/cinematic/voice/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: description,
            voiceName: 'Zephyr',
          }),
        });
        if (!speechRes.ok) throw new Error('Narration failed');
        const { audioData } = await speechRes.json();
        const { createWavBlob } = await import('@/utils/audio');
        const blob = createWavBlob(audioData);
        const url = URL.createObjectURL(blob);
        setBgAudioUrl(url);
        setBgAudioName('AI Narration');
      }
      useCinematicStore.getState().setIsBgPlaying(false);
      setIsProcessing(false);
    } catch (err) {
      setLoadingMsg(
        err instanceof Error ? err.message : 'Ambience generation failed.'
      );
      setIsProcessing(false);
    }
  }, [
    currentImage,
    ambienceType,
    setIsProcessing,
    setLoadingMsg,
    setBgAudioUrl,
    setBgAudioName,
  ]);

  const handleToggleBgAudio = useCallback(() => {
    const el = bgAudioRef.current;
    if (el) {
      if (el.paused) el.play().catch(() => {});
      else el.pause();
    }
  }, []);

  const handleSaveToGallery = useCallback(async () => {
    const state = useCinematicStore.getState();
    if (!state.currentImage || !state.selectedIdea) return;
    const voiceClips = state.voiceClips;
    const resolvedClips = await Promise.all(
      voiceClips.map(async (c) => {
        if (c.audioSrc.startsWith('blob:')) {
          const res = await fetch(c.audioSrc);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
          return { ...c, audioSrc: dataUrl };
        }
        return c;
      })
    );

    // If storybookId is provided, save as a page to that storybook
    if (storybookId) {
      try {
        const storybook = await getStorybookById(storybookId);
        if (!storybook) {
          await dialog.alert('Storybook not found');
          return;
        }

        const newPage: StorybookPage = {
          id: `page-${Date.now()}`,
          storybookId,
          order: storybook.pageIds.length,
          type: 'audio-image',
          timestamp: Date.now(),
          title: state.selectedIdea.title,
          imageUrl: state.currentImage,
          prompt: state.selectedIdea.title,
          quote: state.currentQuote || undefined,
          voiceClips: resolvedClips.length ? resolvedClips : undefined,
          backgroundAudioUrl: state.bgAudioUrl || undefined,
          bgAudioOptions:
            state.bgAudioUrl && (state.bgVolume !== 1 || state.bgPlayCount !== 1 || !state.bgLoop)
              ? { volume: state.bgVolume, playCount: state.bgPlayCount, loop: state.bgLoop }
              : undefined,
        };

        await savePage(newPage);

        // Update storybook pageIds
        const updatedStorybook = {
          ...storybook,
          pageIds: [...storybook.pageIds, newPage.id],
          updatedAt: Date.now(),
          coverImage: storybook.coverImage || state.currentImage, // Use first image as cover
        };
        await saveStorybook(updatedStorybook);

        router.push(`/storybooks/${storybookId}`);
      } catch (err) {
        console.error('Failed to save page to storybook:', err);
        await dialog.alert('Failed to save page to storybook');
      }
    } else {
      // Otherwise, save to gallery as before
      addGalleryItem({
        id: Date.now().toString(),
        imageUrl: state.currentImage,
        prompt: state.selectedIdea.title,
        timestamp: Date.now(),
        quote: state.currentQuote || undefined,
        voiceClips: resolvedClips.length ? resolvedClips : undefined,
        backgroundAudioUrl: state.bgAudioUrl || undefined,
        bgAudioOptions:
          state.bgAudioUrl && (state.bgVolume !== 1 || state.bgPlayCount !== 1 || !state.bgLoop)
            ? { volume: state.bgVolume, playCount: state.bgPlayCount, loop: state.bgLoop }
            : undefined,
      });
      setAppState(AppState.GALLERY);
    }
  }, [addGalleryItem, setAppState, storybookId, router]);

  if (!hasApiKey) {
    return <AccessRequiredView />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-loft-black relative overflow-x-hidden">
      {appState === AppState.GALLERY && <ParticleBackground />}
      <Header />

      <main
        className={`flex-grow flex flex-col items-center justify-center p-6 relative z-10 transition-colors duration-500 ${
          appState === AppState.GALLERY ? 'bg-transparent' : 'bg-loft-gray'
        }`}
      >
        {appState === AppState.UPLOAD && <UploadView />}
        {(appState === AppState.ANALYZING ||
          appState === AppState.GENERATING) && <LoadingView />}
        {appState === AppState.SELECT_PROMPT && (
          <SelectPromptView onGenerate={handleGenerate} />
        )}
        {appState === AppState.EDITING && currentImage && (
          <EditingView
            isProcessing={isProcessing}
            loadingMsg={loadingMsg}
            onTextEdit={handleTextEdit}
            onRegenerate={handleRegenerate}
            onGenerateSpeech={handleGenerateSpeech}
            onPlayClip={handlePlayClip}
            onStopClip={handleStopClip}
            onGenerateAmbience={handleGenerateAmbience}
            onToggleBgAudio={handleToggleBgAudio}
            onSaveToGallery={handleSaveToGallery}
            bgAudioRef={bgAudioRef}
          />
        )}
        {appState === AppState.GALLERY && <GalleryView />}
      </main>

      {appState === AppState.EDITING && (
        <ZoomModal onPlayClip={handlePlayClip} onStopClip={handleStopClip} />
      )}
    </div>
  );
}
