import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text) {
    return new NextResponse('Text parameter is required', { status: 400 });
  }

  try {
    const tts = new EdgeTTS({ voice: 'kk-KZ-AigulNeural', lang: 'kk-KZ' });
    const tmpPath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
    
    await tts.ttsPromise(text, tmpPath);
    
    const fileBuffer = await fs.promises.readFile(tmpPath);
    
    // Clean up the temporary file asynchronously
    fs.promises.unlink(tmpPath).catch(console.error);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return new NextResponse('Error generating TTS', { status: 500 });
  }
}
