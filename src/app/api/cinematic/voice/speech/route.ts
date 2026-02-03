import { NextResponse } from 'next/server';
import { generateCharacterSpeech } from '@/lib/cinematic/gemini-server';

export async function POST(request: Request) {
  try {
    const { text, voiceName } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text' },
        { status: 400 }
      );
    }
    if (!voiceName || typeof voiceName !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid voiceName' },
        { status: 400 }
      );
    }
    const result = await generateCharacterSpeech(text, voiceName);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech generation failed';
    console.error('[cinematic/voice/speech]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
