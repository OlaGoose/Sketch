/**
 * Doubao AI Provider (豆包 AI - 字节跳动)
 * Uses native fetch API for API calls
 */

export interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DoubaoResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Options for Doubao image generation (aligned with infinite-craft-game). */
export interface DoubaoImageOptions {
  width?: number;
  height?: number;
  numberOfImages?: number;
  aspectRatio?: string;
}

const DEFAULT_VISION_TIMEOUT_MS = 60000;
const DEFAULT_IMAGE_MODEL = 'doubao-seedream-4-0-250828';

export class DoubaoProvider {
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private visionModel: string;
  private imageEndpoint: string | undefined;
  private imageModel: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: {
    apiKey: string;
    endpoint: string;
    model: string;
    visionModel?: string;
    imageEndpoint?: string;
    imageModel?: string;
    maxRetries?: number;
    retryDelay?: number;
  }) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
    this.model = config.model;
    this.visionModel = config.visionModel ?? config.model;
    this.imageEndpoint = config.imageEndpoint;
    this.imageModel = config.imageModel ?? DEFAULT_IMAGE_MODEL;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.retryDelay !== undefined) this.retryDelay = config.retryDelay;
  }

  /**
   * Chat completion with retry logic
   */
  async chat(
    messages: DoubaoMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<DoubaoResponse> {
    const payload = {
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    };

    console.log('🔥 Doubao API Request:', {
      url: this.endpoint,
      model: this.model,
      messageCount: messages.length,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Doubao API Error:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            attempt: attempt + 1,
          });

          throw new Error(
            `Doubao API error (${response.status} ${response.statusText}): ${errorText}`
          );
        }

        const data: DoubaoResponse = await response.json();

        console.log('✅ Doubao API Success:', {
          hasContent: !!data.choices?.[0]?.message?.content,
          contentLength: data.choices?.[0]?.message?.content?.length || 0,
          usage: data.usage,
        });

        return data;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ Doubao attempt ${attempt + 1}/${this.maxRetries} failed:`,
          error.message
        );

        // Don't retry on auth errors
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(`   Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Doubao API call failed after retries');
  }

  /**
   * Vision: chat with image (VisualQuestionAnswering).
   * Uses vision model and content array with image_url + text. Supports data URL for base64.
   */
  async chatWithImage(
    prompt: string,
    imageBase64: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
      timeoutMs?: number;
    }
  ): Promise<DoubaoResponse> {
    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    const payload = {
      model: this.visionModel,
      max_completion_tokens: options?.maxTokens ?? 4096,
      reasoning_effort: options?.reasoningEffort ?? 'medium',
      temperature: options?.temperature ?? 0.7,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'image_url' as const, image_url: { url: imageUrl } },
            { type: 'text' as const, text: prompt },
          ],
        },
      ],
    };

    const timeoutMs = options?.timeoutMs ?? DEFAULT_VISION_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log('🔥 Doubao Vision Request:', {
        url: this.endpoint,
        model: this.visionModel,
        promptLength: prompt.length,
      });
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Doubao Vision API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.slice(0, 200),
        });
        throw new Error(
          `Doubao Vision error (${response.status} ${response.statusText}): ${errorText}`
        );
      }
      const data: DoubaoResponse = await response.json();
      console.log('✅ Doubao Vision Success:', {
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: data.choices?.[0]?.message?.content?.length ?? 0,
      });
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        throw new Error('Doubao Vision request timeout');
      }
      throw err;
    }
  }

  /**
   * Generate image from text prompt (same API shape as infinite-craft-game).
   * Uses dedicated image endpoint (DOUBAO_IMAGE_ENDPOINT) and image model.
   */
  async generateImage(
    prompt: string,
    options?: DoubaoImageOptions
  ): Promise<string[]> {
    const baseUrl = (this.imageEndpoint || this.endpoint).replace(/\/$/, '');
    const url = baseUrl.includes('/api/v3/images/generations')
      ? baseUrl
      : `${baseUrl}/api/v3/images/generations`;

    // Map size: 2K for large (e.g. width >= 1920 or 16:9 high-res), else 1K
    const size =
      options?.width && options.width >= 1920 ? '2K' : '1K';

    const payload: Record<string, unknown> = {
      model: this.imageModel,
      prompt,
      response_format: 'url',
      size,
      stream: false,
      watermark: true,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[Doubao Image] Request:', {
        url,
        model: this.imageModel,
        size: payload.size,
        promptLength: prompt.length,
      });
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          const err = new Error(
            `Doubao Image API error (${res.status}): ${errorText}`
          ) as Error & { status?: number; code?: string };
          err.status = res.status;
          err.code = `HTTP_${res.status}`;
          throw err;
        }

        const response = await res.json();
        const urls: string[] =
          response?.data?.map((d: { url?: string }) => d.url).filter(Boolean) ||
          [];
        if (!urls.length) {
          throw new Error(
            `No image URLs from Doubao. Response: ${JSON.stringify(response).slice(0, 200)}`
          );
        }
        return urls;
      } catch (err: any) {
        lastError = err;
        if (err?.message?.includes('401') || err?.message?.includes('403')) {
          throw err;
        }
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError || new Error('Doubao image generation failed after retries');
  }

  /**
   * Parse JSON from response text (handles markdown code blocks)
   */
  static parseJSONResponse(text: string): any {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    const trimmed = text.trim();
    
    console.log('🔍 Parsing JSON response (first 200 chars):', trimmed.substring(0, 200));

    // Try direct parse first
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string' && parsed.trim().startsWith('{')) {
        return JSON.parse(parsed);
      }
      return parsed;
    } catch (directError) {
      console.log('⚠️ Direct JSON parse failed, trying markdown removal...');
      
      // Remove markdown code blocks
      let withoutMarkdown = trimmed
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^json\s*/i, '')
        .trim();

      try {
        return JSON.parse(withoutMarkdown);
      } catch (markdownError) {
        console.log('⚠️ Markdown removal parse failed, trying regex extraction...');
        
        // Try to find JSON in text
        const jsonMatch = withoutMarkdown.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (regexError) {
            // Last resort: try object match
            const objMatch = withoutMarkdown.match(/\{[\s\S]*\}/);
            if (objMatch) {
              return JSON.parse(objMatch[0]);
            }
          }
        }
        
        console.error('❌ All JSON parsing strategies failed');
        console.error('Response preview:', trimmed.substring(0, 500));
        throw new Error('No valid JSON found in response');
      }
    }
  }
}
