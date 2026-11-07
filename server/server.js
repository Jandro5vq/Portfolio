/* Contador de visitantes que llegan al centro del universo.
   GET  /api/universe → { count }
   POST /api/universe → suma uno y devuelve { count, counted }
   Sin dependencias. La cuenta se guarda en DATA_FILE (un volumen de Docker).
   Para que no se infle recargando, cada IP cuenta como mucho una vez cada WINDOW_HOURS;
   las IP no se guardan en disco: solo un hash en memoria. */
'use strict';
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const PORT = +process.env.PORT || 3000;
const FILE = process.env.DATA_FILE || '/data/universe.json';
const WINDOW = (+process.env.WINDOW_HOURS || 12) * 3600e3;
const SALT = crypto.randomBytes(16); // cambia en cada arranque: los hashes no sirven fuera de este proceso

let count = 0;
try { count = Math.max(0, JSON.parse(fs.readFileSync(FILE, 'utf8')).count | 0); } catch (e) {}

function save(){
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ count, updated: new Date().toISOString() }));
  fs.renameSync(tmp, FILE);
}

const recent = new Map(); // hash de IP → última vez que contó
function prune(now){ for (const [k, t] of recent) if (now - t > WINDOW) recent.delete(k); }

// Traefik añade la IP real al final de X-Forwarded-For; las anteriores las puede inventar el cliente
function clientIp(req){
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : req.socket.remoteAddress || '';
}

function send(res, code, body){
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  if (path !== '/api/universe') return send(res, 404, { error: 'not found' });
  if (req.method === 'GET') return send(res, 200, { count });
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });

  req.resume(); // el cuerpo no se usa
  const now = Date.now();
  const key = crypto.createHmac('sha256', SALT).update(clientIp(req)).digest('base64');
  const last = recent.get(key);
  if (last && now - last < WINDOW) return send(res, 200, { count, counted: false });
  recent.set(key, now);
  if (recent.size > 5000) prune(now);
  count++;
  try { save(); } catch (e) { console.error('No se pudo guardar la cuenta:', e.message); }
  send(res, 200, { count, counted: true });
}).listen(PORT, () => console.log(`Contador escuchando en :${PORT} (cuenta actual: ${count})`));
