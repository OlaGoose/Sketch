import { NextResponse } from 'next/server';
import { generateAmbienceDescription } from '@/lib/cinematic/gemini-server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }
    const clean = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const result = await generateAmbienceDescription(clean);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ambience description failed';
    console.error('[cinematic/ambience/description]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
