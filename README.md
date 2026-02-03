# Cinematic Sketch (Next.js)

Transform sketches into cinematic masterpieces using Gemini. Refactored from the original Vite/React app to **Next.js 14 App Router** with the same architecture patterns as [infinite-craft-game](/): API routes, centralized config, Zustand store, and component-based views.

## Features

- **Upload** a concept sketch and analyze it with Gemini Vision
- **Choose** one of 3 AI-generated scene directions (Pixar / Ghibli / Disney style)
- **Generate** 2K or fast Flash images (with optional sketch reference and creativity slider)
- **Edit** the scene with text instructions or blend another image (Magic Studio)
- **Voice** – AI-recommended or manual voice casting, TTS for character dialogue
- **Ambience** – auto-generate narration or soundscape from the scene
- **Gallery** – save and restore projects (persisted in localStorage)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **State:** Zustand with persist (gallery)
- **Styling:** Tailwind CSS (loft theme: yellow/black/gray)
- **AI:** Google Gemini via `@google/genai` (server-side API routes)

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_GEMINI_API_KEY` – **required** for analyze, image generation, edit, voice, and ambience.

Optional (for future multi-provider support):

- `NEXT_PUBLIC_AI_PROVIDER` – `auto` | `gemini` | `doubao` | `openai`
- Doubao / OpenAI keys as in `.env.example`

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Project Structure (aligned with infinite-craft-game)

```
src/
├── app/
│   ├── api/cinematic/     # analyze, generate, edit, voice, ambience
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── views/             # UploadView, LoadingView, SelectPromptView, EditingView, GalleryView
│   ├── panels/            # MagicStudioPanel, RegeneratePanel, VoicePanel, AmbiencePanel
│   ├── Header.tsx
│   ├── ParticleBackground.tsx
│   ├── UsageDisplay.tsx
│   ├── ZoomModal.tsx
│   └── CinematicContainer.tsx
├── lib/
│   ├── config/            # cinematicConfig, isGeminiConfigured
│   ├── store/             # cinematic-store (Zustand)
│   └── cinematic/         # gemini-server (analyze, generate, edit, voice, ambience)
├── types/                 # PromptIdea, GalleryItem, AppState, TokenUsage, etc.
└── utils/                 # cn, audio (decodeAudioData, createWavBlob)
```

## License

Private. Use the same terms as the original Cinematic Sketch project.
