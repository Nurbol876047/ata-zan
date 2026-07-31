const fetch = require('node-fetch');

async function test() {
  const text = encodeURIComponent('Сәлеметсіз бе!');
  const res = await fetch(`https://api.tts.quest/v3/voice/synthesis?text=${text}&voice=kk-KZ-AigulNeural`);
  const data = await res.json();
  console.log(data);
}
test().catch(console.error);
