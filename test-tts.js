const https = require('https');
https.get({
  hostname: 'translate.google.com',
  path: '/translate_tts?ie=UTF-8&client=tw-ob&tl=kk&q=' + encodeURIComponent('Сәлем'),
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}, (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
});
