import { NextResponse } from 'next/server';
import { analyzeEditPrompt } from '@/lib/cinematic/gemini-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput, originalImageBase64, blendImageBase64 } = body as {
      userInput: string;
      originalImageBase64: string;
      blendImageBase64?: string;
    };

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userInput' },
        { status: 400 }
      );
    }

    if (!originalImageBase64 || typeof originalImageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid originalImageBase64' },
        { status: 400 }
      );
    }

    const result = await analyzeEditPrompt(
      userInput,
      originalImageBase64,
      blendImageBase64
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('[cinematic/edit/analyze-prompt]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
