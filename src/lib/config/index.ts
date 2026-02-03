/**
 * Cinematic Sketch - Configuration from environment
 */

function getEnv(key: string): string | undefined {
  return process.env[key];
}

export const cinematicConfig = {
  /** Gemini API key (server-side). Use NEXT_PUBLIC_ for client-only if needed. */
  get geminiApiKey(): string | undefined {
    return getEnv('NEXT_PUBLIC_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
  },
  get geminiModel(): string {
    return getEnv('NEXT_PUBLIC_GEMINI_MODEL') || 'gemini-2.5-flash';
  },
  /** Preferred AI provider: auto | gemini | doubao | openai */
  get aiProvider(): string {
    return getEnv('NEXT_PUBLIC_AI_PROVIDER') || 'auto';
  },
  get doubaoApiKey(): string | undefined {
    return getEnv('NEXT_DOUBAO_API_KEY');
  },
  get doubaoChatModel(): string {
    return getEnv('NEXT_DOUBAO_CHAT_MODEL') || 'doubao-seed-1-6-lite-251015';
  },
  get doubaoChatEndpoint(): string | undefined {
    return getEnv('NEXT_DOUBAO_CHAT_ENDPOINT');
  },
  get openaiApiKey(): string | undefined {
    return getEnv('NEXT_PUBLIC_OPENAI_API_KEY');
  },
  get openaiModel(): string {
    return getEnv('NEXT_PUBLIC_OPENAI_MODEL') || 'gpt-4o-mini';
  },
};

export function isGeminiConfigured(): boolean {
  const key = cinematicConfig.geminiApiKey;
  return !!key && key !== 'your_api_key' && !key.startsWith('your_');
}
