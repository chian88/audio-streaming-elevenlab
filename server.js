import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import WebSocket from 'ws';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3003;
const API_KEY = process.env.ELEVENLABS_API_KEY;

app.use(express.static(__dirname));

app.get('/api/token', async (req, res) => {
  const resp = await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY }
  });
  const data = await resp.json();
  res.json({ token: data.token });
});

app.get('/api/region', async (req, res) => {
  const wsRegion = await probeWsRegion().catch(() => 'unknown');
  res.json({ ws: wsRegion });
});

function probeWsRegion() {
  return new Promise((resolve, reject) => {
    const url = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime';
    const ws = new WebSocket(url, {
      headers: { 'xi-api-key': API_KEY }
    });

    ws.on('upgrade', (response) => {
      const region = response.headers['x-region'] || 'unknown';
      resolve(region);
      ws.close();
    });

    ws.on('open', () => {
      setTimeout(() => ws.close(), 500);
    });

    ws.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      ws.close();
      reject(new Error('timeout'));
    }, 5000);
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
