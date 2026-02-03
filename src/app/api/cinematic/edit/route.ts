import { NextResponse } from 'next/server';
import { editScene } from '@/lib/cinematic/gemini-server';
import type { ImageModelType, ImageSize } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      imageBase64,
      instruction,
      blendImageBase64,
      model,
      size,
    } = body as {
      imageBase64: string;
      instruction: string;
      blendImageBase64?: string;
      model?: ImageModelType;
      size?: ImageSize;
    };

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }
    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid instruction' },
        { status: 400 }
      );
    }

    const result = await editScene(
      imageBase64,
      instruction,
      blendImageBase64,
      model != null || size != null ? { model, size } : undefined
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Edit failed';
    console.error('[cinematic/edit]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
