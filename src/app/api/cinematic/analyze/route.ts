import { NextResponse } from 'next/server';
import { analyzeSketch } from '@/lib/cinematic/gemini-server';

function isNetworkError(message: string): boolean {
  return (
    message.includes('fetch failed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('timeout') ||
    message.includes('network')
  );
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('🎨 [cinematic/analyze] Received analyze request');
    
    const { imageBase64 } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.error('❌ [cinematic/analyze] Missing or invalid imageBase64');
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }
    
    console.log('📸 [cinematic/analyze] Image data length:', imageBase64.length);
    const clean = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    console.log('🔧 [cinematic/analyze] Cleaned base64 length:', clean.length);
    
    const result = await analyzeSketch(clean);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [cinematic/analyze] Success in ${duration}ms`);
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Analysis failed';
    const cause = error instanceof Error && error.cause ? String(error.cause) : '';
    const stack = error instanceof Error && error.stack ? error.stack : '';
    
    console.error(`❌ [cinematic/analyze] exception ${error?.constructor?.name}: ${message} ${cause ? `cause: ${cause}` : ''}`);
    if (stack) {
      console.error('[cinematic/analyze] Stack trace:', stack);
    }
    console.error(`⏱️  [cinematic/analyze] Failed after ${duration}ms`);
    
    const status = isNetworkError(message) ? 503 : 500;
    const userMessage =
      status === 503
        ? 'Network or Gemini service unavailable. Check your connection and API key, then try again.'
        : message;
    
    return NextResponse.json(
      { error: userMessage },
      { status }
    );
  }
}
