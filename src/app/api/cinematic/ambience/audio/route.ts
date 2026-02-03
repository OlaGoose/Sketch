import { NextResponse } from 'next/server';
import {
  generateBackgroundAudio,
  createWavBlobFromBase64,
} from '@/lib/cinematic/gemini-server';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid description' },
        { status: 400 }
      );
    }
    const { audioData, usage } = await generateBackgroundAudio(description);
    const wavBuffer = createWavBlobFromBase64(audioData);
    const base64Wav = wavBuffer.toString('base64');
    return NextResponse.json({
      audioDataBase64Wav: base64Wav,
      usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ambience audio failed';
    console.error('[cinematic/ambience/audio]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
