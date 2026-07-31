const { EdgeTTS } = require('node-edge-tts');
const tts = new EdgeTTS();
async function test() {
  await tts.voice({ language: 'kk-KZ', voice: 'kk-KZ-AigulNeural' });
  const stream = await tts.toStream('Сәлеметсіз бе!');
  stream.on('data', chunk => console.log('Chunk received:', chunk.length));
  stream.on('end', () => console.log('Stream ended'));
}
test().catch(console.error);
