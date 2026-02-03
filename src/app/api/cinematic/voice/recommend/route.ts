import { NextResponse } from 'next/server';
import { recommendVoice } from '@/lib/cinematic/gemini-server';

export async function POST(request: Request) {
  try {
    const { imageBase64, text } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text' },
        { status: 400 }
      );
    }
    const clean = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const result = await recommendVoice(clean, text);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Voice recommendation failed';
    console.error('[cinematic/voice/recommend]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
