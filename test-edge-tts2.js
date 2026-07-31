const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tts = new EdgeTTS({ voice: 'kk-KZ-AigulNeural', lang: 'kk-KZ' });

async function test() {
  const tmpPath = path.join(os.tmpdir(), `tts-${Date.now()}.mp3`);
  console.log('Writing to', tmpPath);
  await tts.ttsPromise('Сәлеметсіз бе! Мен Қазақстан Республикасының', tmpPath);
  console.log('File size:', fs.statSync(tmpPath).size);
}
test().catch(console.error);
