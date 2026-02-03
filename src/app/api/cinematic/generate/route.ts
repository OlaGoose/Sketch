import { NextResponse } from 'next/server';
import { generateScene } from '@/lib/cinematic/gemini-server';
import type { ImageModelType, ImageSize } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = 'gemini-2.5-flash-image',
      size = '2K',
      referenceImageBase64,
      temperature = 0.5,
    } = body as {
      prompt: string;
      model?: ImageModelType;
      size?: ImageSize;
      referenceImageBase64?: string;
      temperature?: number;
    };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    const result = await generateScene(
      prompt,
      model,
      size,
      referenceImageBase64,
      temperature
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    console.error('[cinematic/generate]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
