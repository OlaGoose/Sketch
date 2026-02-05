/**
 * Cinematic Sketch - Server-side Gemini API
 * Used only in API routes. API key from env.
 * - Sketch analysis: @google/generative-ai (same as english-map/v3) to avoid fetch failures in Node.
 * - Image generation: fetch + responseModalities ['Image'] (Nano Banana).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GoogleGenAI,
  Type,
  type GenerateContentResponse,
  Modality,
} from '@google/genai';
import OpenAI from 'openai';
import { DoubaoProvider } from './doubao';
import type { PromptIdea, TokenUsage, ImageModelType, ImageSize } from '@/types';

const GEMINI_ENDPOINT =
  process.env.GEMINI_ENDPOINT ||
  'https://generativelanguage.googleapis.com/v1beta';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function calculateCost(
  model: string,
  usage: { promptTokenCount?: number; candidatesTokenCount?: number }
): string {
  const input = usage.promptTokenCount || 0;
  const output = usage.candidatesTokenCount || 0;
  let cost = 0;
  if (model.includes('pro')) {
    cost = input * 0.0000025 + output * 0.000005;
  } else {
    cost = input * 0.000000075 + output * 0.0000003;
  }
  return `$${cost.toFixed(6)}`;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 [retryOperation] Retry attempt ${attempt}/${retries} after ${delayMs}ms`);
        await delay(delayMs);
      }
      
      return await operation();
    } catch (err: unknown) {
      lastError = err;
      const error = err as Record<string, unknown>;
      const message = typeof error?.message === 'string' ? error.message : '';
      
      // Check if this is a retryable error
      const isRetryable =
        error?.status === 503 ||
        error?.code === 503 ||
        error?.status === 429 ||
        error?.code === 429 ||
        message.includes('overloaded') ||
        message.includes('503') ||
        message.includes('429') ||
        message.includes('fetch failed') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ENOTFOUND') ||
        (error?.error as Record<string, unknown>)?.code === 503 ||
        (error?.error as Record<string, unknown>)?.status === 'UNAVAILABLE';

      // Log the error
      console.warn(`⚠️  [retryOperation] Attempt ${attempt + 1} failed:`, message);

      // If not retryable or no retries left, throw immediately
      if (!isRetryable || attempt >= retries) {
        console.error(`❌ [retryOperation] Giving up after ${attempt + 1} attempts`);
        throw err;
      }

      // Exponential backoff for next retry
      delayMs = Math.min(delayMs * 2, 10000); // Max 10 seconds
    }
  }
  
  throw lastError;
}

function getApiKey(): string {
  const key =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('❌ [getApiKey] No Gemini API key found in environment variables');
    throw new Error('Gemini API key not configured');
  }
  
  // Validate API key format (basic check)
  if (!key.startsWith('AIza')) {
    console.warn('⚠️  [getApiKey] API key format may be invalid (should start with AIza)');
  }
  
  console.log('✅ [getApiKey] API key found:', key.substring(0, 10) + '...');
  return key;
}

/** Call Gemini generateContent via fetch (same shape as infinite-craft-game) for image generation. */
async function generateContentFetch(
  model: string,
  contents: Array<{ parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
  generationConfig: Record<string, unknown>
): Promise<{ response: unknown }> {
  const url = `${GEMINI_ENDPOINT}/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': getApiKey(),
    },
    body: JSON.stringify({ contents, generationConfig }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    let err: Error;
    try {
      const data = JSON.parse(bodyText) as { error?: { message?: string } };
      err = new Error((data?.error?.message || bodyText).slice(0, 500));
    } catch {
      err = new Error(bodyText.slice(0, 500));
    }
    (err as unknown as Record<string, unknown>).status = res.status;
    (err as unknown as Record<string, unknown>).code = res.status;
    throw err;
  }

  try {
    return { response: JSON.parse(bodyText) as unknown };
  } catch {
    throw new Error('Invalid JSON response from Gemini');
  }
}

/** Sketch analysis uses @google/generative-ai (same as english-map/v3) to avoid fetch failures in Node. */
const ANALYZE_MODEL = 'gemini-2.5-flash';
const ANALYZE_TIMEOUT_MS = 60_000;

export async function analyzeSketch(
  base64Image: string
): Promise<{ ideas: PromptIdea[]; usage: TokenUsage }> {
  const prompt = `You are a visual concept artist specializing in animation styles loved by children and families, such as Pixar, Disney, and Studio Ghibli (Miyazaki).
Analyze the provided sketch. It is a rough draft for an animated movie scene.
Your task is to interpret the sketch and generate 3 DISTINCT, HIGH-QUALITY cinematic scene descriptions based on these specific animation styles.

For each idea, provide:
1. A short, catchy Title (in Japanese if the prompt implies Ghibli style, otherwise English/Japanese mixed).
2. A simple, evocative Description for the user.
3. A highly detailed Technical Prompt for an image generation model. CRITICAL: The technical prompt MUST explicitly specify the art style.
   - Option 1: Pixar/Dreamworks style (3D render, high fidelity, vibrant lighting, soft shadows, expressive characters, octane render).
   - Option 2: Studio Ghibli/Miyazaki style (Hand-painted backgrounds, watercolor texture, anime character design, nostalgic atmosphere, Hayao Miyazaki style).
   - Option 3: Disney Renaissance or Modern Disney style (Magical realism, fluid shapes, theatrical lighting, storybook aesthetic).

Return ONLY a valid JSON array of exactly 3 objects, each with keys: "title", "description", "technicalPrompt". No markdown, no code fences, no other text.`;

  let lastError: any = null;

  // Try Doubao first (works in China)
  try {
    const doubaoKey = process.env.NEXT_DOUBAO_API_KEY;
    const doubaoEndpoint = process.env.NEXT_DOUBAO_CHAT_ENDPOINT;
    const doubaoModel = process.env.NEXT_DOUBAO_CHAT_MODEL;

    if (doubaoKey && doubaoEndpoint && doubaoModel) {
      console.log('🔥 [analyzeSketch] Trying Doubao Vision...');
      const doubao = new DoubaoProvider({
        apiKey: doubaoKey,
        endpoint: doubaoEndpoint,
        model: doubaoModel,
        visionModel: doubaoModel,
      });

      const result = await doubao.chatWithImage(prompt, base64Image, {
        maxTokens: 2048,
        temperature: 0.7,
        timeoutMs: ANALYZE_TIMEOUT_MS,
      });

      const text = result.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Empty response from Doubao');
      }

      console.log('📝 [analyzeSketch] Doubao response received, length:', text.length);
      
      const parsedData = DoubaoProvider.parseJSONResponse(text);
      console.log('✅ [analyzeSketch] Doubao success, ideas count:', parsedData.length);

      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('Doubao did not return valid scene ideas');
      }

      const usage: TokenUsage = {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
        estimatedCost: '$0.000000',
      };

      const ideas: PromptIdea[] = parsedData.slice(0, 3).map(
        (item: any, index: number) => ({
          id: `idea-${index}`,
          title: item.title || item.Title || '',
          description: item.description || item.Description || '',
          technicalPrompt: item.technicalPrompt || item.technical_prompt || item.TechnicalPrompt || '',
        })
      );

      return { ideas, usage };
    } else {
      console.log('ℹ️  [analyzeSketch] Doubao not configured, skipping...');
    }
  } catch (error: any) {
    lastError = error;
    console.warn('❌ [analyzeSketch] Doubao failed:', error.message);
  }

  // Try Gemini first
  try {
    console.log('🔄 [analyzeSketch] Trying Gemini...');
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: ANALYZE_MODEL,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini analysis timeout after 60s')), ANALYZE_TIMEOUT_MS);
    });

    const result = await retryOperation(() =>
      Promise.race([
        model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image,
            },
          },
        ]),
        timeoutPromise,
      ])
    );

    const text = result.response.text();
    console.log('📝 [analyzeSketch] Gemini response received, length:', text.length);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array in Gemini response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('✅ [analyzeSketch] Gemini success, ideas count:', parsedData.length);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('Gemini did not return valid scene ideas');
    }

    const usage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: calculateCost(ANALYZE_MODEL, {}),
    };

    const ideas: PromptIdea[] = parsedData.slice(0, 3).map(
      (item: { title?: string; description?: string; technicalPrompt?: string }, index: number) => ({
        id: `idea-${index}`,
        title: item.title ?? '',
        description: item.description ?? '',
        technicalPrompt: item.technicalPrompt ?? '',
      })
    );

    return { ideas, usage };
  } catch (error: any) {
    lastError = error;
    console.warn('❌ [analyzeSketch] Gemini failed:', error.message);
    
    // Check if it's a network error
    if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      console.log('ℹ️  [analyzeSketch] Network error detected, trying OpenAI fallback...');
    }
  }

  // Fallback to OpenAI
  try {
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔄 [analyzeSketch] Trying OpenAI Vision fallback...');
    const openai = new OpenAI({
      apiKey: openaiKey,
      timeout: 60000,
      maxRetries: 2,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2048,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('📝 [analyzeSketch] OpenAI response received');
    
    // OpenAI returns an object, need to find the array in it
    const parsedResponse = JSON.parse(text);
    let parsedData: any[];
    
    // Handle both direct array and nested object with array
    if (Array.isArray(parsedResponse)) {
      parsedData = parsedResponse;
    } else if (parsedResponse.ideas && Array.isArray(parsedResponse.ideas)) {
      parsedData = parsedResponse.ideas;
    } else if (parsedResponse.scenes && Array.isArray(parsedResponse.scenes)) {
      parsedData = parsedResponse.scenes;
    } else {
      // Try to find any array in the response
      const arrayKey = Object.keys(parsedResponse).find(key => Array.isArray(parsedResponse[key]));
      if (arrayKey) {
        parsedData = parsedResponse[arrayKey];
      } else {
        throw new Error('No array found in OpenAI response');
      }
    }

    console.log('✅ [analyzeSketch] OpenAI success (fallback), ideas count:', parsedData.length);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('OpenAI did not return valid scene ideas');
    }

    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      estimatedCost: '$0.000000', // Simplified for OpenAI
    };

    const ideas: PromptIdea[] = parsedData.slice(0, 3).map(
      (item: any, index: number) => ({
        id: `idea-${index}`,
        title: item.title || item.Title || '',
        description: item.description || item.Description || '',
        technicalPrompt: item.technicalPrompt || item.technical_prompt || item.TechnicalPrompt || '',
      })
    );

    return { ideas, usage };
  } catch (error: any) {
    console.error('❌ [analyzeSketch] OpenAI fallback also failed:', error.message);
    
    // If OpenAI also fails, throw a comprehensive error
    throw new Error(
      'All AI providers failed to analyze the sketch. ' +
      'Original error: ' + (lastError?.message || 'Unknown error') +
      '. Please check your network connection and API keys.'
    );
  }
}

/** Default image model (Nano Banana); fallback when requested model is unavailable. */
const IMAGE_MODEL_DEFAULT = 'gemini-2.5-flash-preview-05-20';

export async function generateScene(
  prompt: string,
  model: ImageModelType,
  size: ImageSize = '2K',
  referenceImage?: string,
  temperature?: number
): Promise<{ imageUrl: string; usage: TokenUsage }> {
  // Doubao image generation (reference: infinite-craft-game)
  if (model === 'doubao') {
    const doubaoKey = process.env.NEXT_DOUBAO_API_KEY;
    const imageEndpoint =
      process.env.DOUBAO_IMAGE_ENDPOINT ||
      process.env.NEXT_DOUBAO_IMAGE_ENDPOINT;
    const chatEndpoint = process.env.NEXT_DOUBAO_CHAT_ENDPOINT;
    const imageModel =
      process.env.DOUBAO_IMAGE_MODEL ||
      process.env.NEXT_DOUBAO_IMAGE_MODEL ||
      'doubao-seedream-4-0-250828';

    if (!doubaoKey) {
      throw new Error('Doubao API key not configured');
    }
    if (!imageEndpoint) {
      throw new Error(
        'Doubao image endpoint not configured. Set DOUBAO_IMAGE_ENDPOINT or NEXT_DOUBAO_IMAGE_ENDPOINT.'
      );
    }

    const doubao = new DoubaoProvider({
      apiKey: doubaoKey,
      endpoint: chatEndpoint || imageEndpoint,
      model: imageModel,
      imageEndpoint,
      imageModel,
    });

    const width = size === '4K' || size === '2K' ? 1920 : 1024;
    const images = await doubao.generateImage(prompt, {
      width,
      height: Math.round((width * 9) / 16),
      numberOfImages: 1,
      aspectRatio: '16:9',
    });

    const imageUrl = images[0];
    if (!imageUrl) throw new Error('Doubao did not return an image');

    return {
      imageUrl,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: '$0.000000',
      },
    };
  }

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (referenceImage) {
    const clean = referenceImage.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ''
    );
    parts.push({ inlineData: { mimeType: 'image/png', data: clean } });
  }

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['Image'],
    temperature: temperature ?? 0.5,
    imageConfig: { aspectRatio: '16:9' as const },
  };
  if (model === 'gemini-3-pro-image-preview') {
    (generationConfig.imageConfig as Record<string, string>).imageSize = size;
  }

  const geminiModels = [
    model,
    IMAGE_MODEL_DEFAULT,
    'gemini-2.5-flash-image',
  ].filter((m): m is string => m !== 'doubao' && typeof m === 'string');
  const modelsToTry = [...new Set(geminiModels)];

  let lastError: Error | null = null;
  for (const tryModel of modelsToTry) {
    try {
      const { response } = await retryOperation(() =>
        generateContentFetch(
          tryModel,
          [{ parts }],
          generationConfig
        )
      );

      return parseImageResponse(response, tryModel);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const status = (err as Record<string, unknown>)?.status;
      const code = (err as Record<string, unknown>)?.code;
      if (status === 404 || code === 404 || (typeof lastError.message === 'string' && (lastError.message.includes('404') || lastError.message.includes('not found')))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Image generation failed');
}

export async function editScene(
  originalImageBase64: string,
  editInstruction: string,
  blendImageBase64?: string,
  options?: { model?: ImageModelType; size?: ImageSize }
): Promise<{ imageUrl: string; usage: TokenUsage }> {
  const model = options?.model ?? 'gemini-2.5-flash-image';
  const size = options?.size ?? '2K';

  // Doubao: text-to-image only (no image-in); use edit instruction as prompt
  if (model === 'doubao') {
    const doubaoKey = process.env.NEXT_DOUBAO_API_KEY;
    const imageEndpoint =
      process.env.DOUBAO_IMAGE_ENDPOINT ||
      process.env.NEXT_DOUBAO_IMAGE_ENDPOINT;
    const chatEndpoint = process.env.NEXT_DOUBAO_CHAT_ENDPOINT;
    const imageModel =
      process.env.DOUBAO_IMAGE_MODEL ||
      process.env.NEXT_DOUBAO_IMAGE_MODEL ||
      'doubao-seedream-4-0-250828';

    if (!doubaoKey || !imageEndpoint) {
      throw new Error('Doubao API key or image endpoint not configured');
    }

    const doubao = new DoubaoProvider({
      apiKey: doubaoKey,
      endpoint: chatEndpoint || imageEndpoint,
      model: imageModel,
      imageEndpoint,
      imageModel,
    });

    const prompt =
      blendImageBase64
        ? `ACT AS A CINEMATIC COMPOSITOR. Integrate the reference element into the scene. ${editInstruction || 'Seamlessly blend the element into the scene.'}`
        : (editInstruction || 'Enhance this image');

    const width = size === '4K' || size === '2K' ? 1920 : 1024;
    const images = await doubao.generateImage(prompt, {
      width,
      height: Math.round((width * 9) / 16),
      numberOfImages: 1,
      aspectRatio: '16:9',
    });

    const imageUrl = images[0];
    if (!imageUrl) throw new Error('Doubao did not return an image');

    return {
      imageUrl,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: '$0.000000',
      },
    };
  }

  const cleanBase64 = originalImageBase64.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ''
  );

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
  ];

  let finalPrompt = editInstruction || 'Enhance this image';
  if (blendImageBase64) {
    const cleanBlend = blendImageBase64.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ''
    );
    parts.push({
      inlineData: { mimeType: 'image/png', data: cleanBlend },
    });
    finalPrompt = `
ACT AS A CINEMATIC COMPOSITOR.
INPUTS: IMAGE 1 = BASE SCENE, IMAGE 2 = REFERENCE ELEMENT.
TASK: Seamlessly integrate the visual subject/elements from IMAGE 2 into IMAGE 1.
RULES: Match perspective, lighting, and art style of IMAGE 1. Final result must look like one painting.
USER INSTRUCTION: ${editInstruction || 'Integrate the element from the second image into the scene naturally.'}
`;
  }
  parts.push({ text: finalPrompt });

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['Image'],
    imageConfig: { aspectRatio: '16:9' as const },
  };
  if (model === 'gemini-3-pro-image-preview') {
    (generationConfig.imageConfig as Record<string, string>).imageSize = size;
  }

  const geminiModels = [
    model,
    IMAGE_MODEL_DEFAULT,
    'gemini-2.5-flash-image',
  ].filter((m): m is string => m !== 'doubao' && typeof m === 'string');
  const modelsToTry = [...new Set(geminiModels)];

  let lastErr: Error | null = null;
  for (const tryModel of modelsToTry) {
    try {
      const { response } = await retryOperation(() =>
        generateContentFetch(tryModel, [{ parts }], generationConfig)
      );
      return parseImageResponse(response, tryModel);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const status = (err as Record<string, unknown>)?.status;
      const code = (err as Record<string, unknown>)?.code;
      if (status === 404 || code === 404) continue;
      throw err;
    }
  }
  throw lastErr || new Error('Image edit failed');
}

function parseImageResponse(response: unknown, model: string): { imageUrl: string; usage: TokenUsage } {
  const data = response as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  };
  const usageData = data.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost(model, usageData || {}),
  };
  let imageUrl = '';
  let textResponse = '';
  const partsOut = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of partsOut) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      break;
    }
    if (part.text) textResponse += part.text;
  }
  if (!imageUrl) {
    const reason = data.candidates?.[0]?.finishReason || 'Unknown';
    throw new Error(
      (textResponse || `Failed to generate image (Reason: ${reason})`).slice(0, 500)
    );
  }
  return { imageUrl, usage };
}

export async function recommendVoice(
  imageBase64: string,
  userText: string
): Promise<{ voiceName: string; reason: string; usage: TokenUsage }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = imageBase64.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ''
  );

  const systemPrompt = `
You are a casting director for an animated movie. 
Analyze the character in the image and the dialogue they are speaking: "${userText}".
Select the most suitable voice from: Puck (Male, witty), Charon (Male, deep), Kore (Female, soothing), Fenrir (Male, intense), Zephyr (Female, bright).
Return JSON with voiceName and reason.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      voiceName: {
        type: Type.STRING,
        enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'],
      },
      reason: { type: Type.STRING },
    },
    required: ['voiceName', 'reason'],
  };

  const response = (await retryOperation(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: `Dialogue: ${userText}` },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    })
  )) as GenerateContentResponse;

  const usageData = response.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost('gemini-2.5-flash', usageData || {}),
  };

  const data = JSON.parse((response as { text?: string }).text || '{}');
  return {
    voiceName: data.voiceName || 'Kore',
    reason: data.reason || 'Default',
    usage,
  };
}

export async function generateCharacterSpeech(
  text: string,
  voiceName: string
): Promise<{ audioData: string; usage: TokenUsage }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const response = (await retryOperation(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    })
  )) as GenerateContentResponse;

  const usageData = response.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost(
      'gemini-2.5-flash-preview-tts',
      usageData || {}
    ),
  };

  const audioData =
    (response.candidates?.[0]?.content?.parts?.[0] as { inlineData?: { data?: string } })
      ?.inlineData?.data;
  if (!audioData) throw new Error('No audio generated');

  return { audioData, usage };
}

export async function generateAmbienceDescription(
  imageBase64: string
): Promise<{ description: string; usage: TokenUsage }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = imageBase64.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ''
  );

  const response = (await retryOperation(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          {
            text: 'Describe the ambient sounds of this scene in 1 sentence. Focus on wind, rain, crowds, silence, or machines. Make it atmospheric.',
          },
        ],
      },
    })
  )) as GenerateContentResponse;

  const usageData = response.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost('gemini-2.5-flash', usageData || {}),
  };

  const description = (response as { text?: string }).text?.trim() || 'Silence.';
  return { description, usage };
}

export async function generateBackgroundAudio(
  description: string
): Promise<{ audioData: string; usage: TokenUsage }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const response = (await retryOperation(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [
          {
            text: `(Atmospheric soundscape description): ${description}`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    })
  )) as GenerateContentResponse;

  const usageData = response.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost(
      'gemini-2.5-flash-preview-tts',
      usageData || {}
    ),
  };

  const audioData =
    (response.candidates?.[0]?.content?.parts?.[0] as { inlineData?: { data?: string } })
      ?.inlineData?.data;
  if (!audioData) throw new Error('No audio generated');

  return { audioData, usage };
}

/**
 * Analyze user's edit prompt and generate intelligent recommendations
 * Uses Gemini to understand intent, analyze images, and suggest optimal prompt + properties
 */
export async function analyzeEditPrompt(
  userInput: string,
  originalImageBase64: string,
  blendImageBase64?: string
): Promise<{
  optimizedPrompt: string;
  properties: Array<{
    id: string;
    category: string;
    name: string;
    value: string;
    isActive: boolean;
  }>;
  usage: TokenUsage;
}> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const cleanOriginal = originalImageBase64.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ''
  );

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { inlineData: { mimeType: 'image/png', data: cleanOriginal } },
  ];

  if (blendImageBase64) {
    const cleanBlend = blendImageBase64.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ''
    );
    parts.push({ inlineData: { mimeType: 'image/png', data: cleanBlend } });
  }

  const systemPrompt = `You are an expert image editing AI specialized in Gemini's image generation capabilities.

Your task:
1. Analyze the provided image(s) and user's intent: "${userInput}"
2. Generate an optimized, detailed prompt following Gemini image editing best practices
3. Extract/generate dynamic properties that can be adjusted

Your response must be valid JSON with this structure:
{
  "optimizedPrompt": "A hyper-specific, detailed prompt...",
  "properties": [
    {
      "category": "Visual Style",
      "name": "Art Style",
      "value": "Photorealistic"
    },
    {
      "category": "Atmosphere",
      "name": "Lighting",
      "value": "Warm golden hour"
    },
    {
      "category": "Elements",
      "name": "Added Object",
      "value": "Vintage car"
    }
  ]
}

CRITICAL GUIDELINES:
- Be hyper-specific in the optimized prompt (lighting, materials, perspective, style details)
- Generate 5-8 properties across categories: Visual Style, Atmosphere, Elements, Composition, Effects
- Property values should be descriptive but concise
- The optimized prompt should incorporate all property values coherently
- Follow Gemini best practices: specify camera angles, lighting details, material properties
- For inpainting/editing: describe what to preserve and what to change explicitly
- For style transfer: specify artistic techniques and aesthetic details`;

  parts.push({ text: systemPrompt });

  const response = (await retryOperation(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })
  )) as GenerateContentResponse;

  const usageData = response.usageMetadata;
  const usage: TokenUsage = {
    inputTokens: usageData?.promptTokenCount || 0,
    outputTokens: usageData?.candidatesTokenCount || 0,
    totalTokens: usageData?.totalTokenCount || 0,
    estimatedCost: calculateCost('gemini-2.5-flash', usageData || {}),
  };

  const text = (response as { text?: string }).text || '{}';
  const data = JSON.parse(text) as {
    optimizedPrompt?: string;
    properties?: Array<{ category?: string; name?: string; value?: string }>;
  };

  if (!data.optimizedPrompt || !Array.isArray(data.properties)) {
    throw new Error('Invalid response from AI prompt analyzer');
  }

  const properties = data.properties.map((prop, idx) => ({
    id: `prop-${idx}-${Date.now()}`,
    category: prop.category || 'General',
    name: prop.name || 'Property',
    value: prop.value || '',
    isActive: true,
  }));

  return {
    optimizedPrompt: data.optimizedPrompt,
    properties,
    usage,
  };
}

/** Build WAV blob from raw PCM base64 (for response or client). */
export function createWavBlobFromBase64(base64Data: string): Buffer {
  const binaryString = Buffer.from(base64Data, 'base64');
  const len = binaryString.length;
  const wavHeader = Buffer.alloc(44);
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + len, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(
    sampleRate * numChannels * (bitsPerSample / 8),
    28
  );
  wavHeader.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(len, 40);

  return Buffer.concat([wavHeader, binaryString]);
}
