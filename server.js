const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function send(response, status, body, type = 'application/json; charset=utf-8') { response.writeHead(status, { 'Content-Type': type }); response.end(body); }
function readBody(request) { return new Promise((resolve, reject) => { let data = ''; request.on('data', chunk => { data += chunk; if (data.length > 1000000) reject(new Error('Request too large')); }); request.on('end', () => resolve(data)); request.on('error', reject); }); }

async function analyze(signal) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const prompt = `You are Signal Bridge, a careful operations analyst. Convert the user signal below into JSON only. Do not invent facts. Use "Needs confirmation" for missing facts. Return exactly this shape: {"title":string,"summary":string,"location":string,"time":string,"people":string,"tags":string[],"confidence":number,"priority":string,"sourceQuality":string,"actions":[[string,string,string,string],[string,string,string,string],[string,string,string,string]]}. Confidence must reflect evidence quality from 0 to 100. Priority must be one of HIGH PRIORITY, MEDIUM PRIORITY, REVIEW NEEDED. Source quality must be one of Corroborated, Partially verified, Unverified. Actions should be practical and proportionate, not claims that an external action was already taken.\n\nUSER SIGNAL:\n${signal}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }) });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no analysis');
  return JSON.parse(text);
}

async function handleRequest(request, response) {
  if (request.method === 'POST' && request.url === '/api/analyze') {
    try { const body = JSON.parse(await readBody(request)); if (!body.signal?.trim()) return send(response, 400, JSON.stringify({ error: 'Signal is required' })); return send(response, 200, JSON.stringify(await analyze(body.signal))); } catch (error) { return send(response, 502, JSON.stringify({ error: error.message })); }
  }
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.join(root, requested);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(response, 404, 'Not found', 'text/plain; charset=utf-8');
  send(response, 200, fs.readFileSync(filePath), mime[path.extname(filePath)] || 'application/octet-stream');
}

if (require.main === module) {
  http.createServer(handleRequest).listen(port, () => console.log(`Signal Bridge running at http://localhost:${port}`));
}

module.exports = handleRequest;
