const WebSocket = require('ws');
const CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${CLIENT_TOKEN}`;

const ws = new WebSocket(SYNTH_URL, {
  headers: {
    Origin: 'https://ata-zan.onrender.com'
  }
});

ws.on('open', () => {
  console.log('Connected successfully!');
  ws.close();
});

ws.on('error', (err) => {
  console.error('Error connecting:', err.message);
});

ws.on('unexpected-response', (req, res) => {
  console.log('Unexpected response:', res.statusCode);
});
