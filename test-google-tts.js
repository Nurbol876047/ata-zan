const fetch = require('node-fetch');

async function test() {
  const url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=kk&q=' + encodeURIComponent('Сәлеметсіз бе!');
  const res = await fetch(url);
  console.log('Status:', res.status);
  console.log('Type:', res.headers.get('content-type'));
}
test().catch(console.error);
