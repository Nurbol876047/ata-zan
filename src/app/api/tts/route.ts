import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text) {
    return new Response('Text parameter is required', { status: 400 });
  }

  const child = spawn('edge-tts', [
    '--voice', 'kk-KZ-AigulNeural',
    '--text', text
  ]);

  const stream = new ReadableStream({
    start(controller) {
      child.stdout.on('data', (chunk) => {
        controller.enqueue(chunk);
      });

      child.stdout.on('end', () => {
        controller.close();
      });

      child.on('error', (err) => {
        console.error('edge-tts error:', err);
        controller.error(err);
      });
    },
    cancel() {
      child.kill();
    }
  });

  req.signal.addEventListener('abort', () => {
    child.kill();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
