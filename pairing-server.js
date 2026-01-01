const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const CODE_TTL_MS = (process.env.CODE_TTL_MINUTES ? Number(process.env.CODE_TTL_MINUTES) : 10) * 60 * 1000;
const PAIRING_SECRET = process.env.PAIRING_SECRET || ''; // if set, bot must send this secret

// In-memory store: code -> { sessionId: string|null, createdAt: number, expiresAt: number }
const codes = new Map();

function makeCode() {
  // 6-char alphanumeric uppercase
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Cleanup expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, info] of codes.entries()) {
    if (info.expiresAt <= now) codes.delete(code);
  }
}, 60 * 1000);

app.get('/create', (req, res) => {
  let code;
  do {
    code = makeCode();
  } while (codes.has(code));
  const now = Date.now();
  const expiresAt = now + CODE_TTL_MS;
  codes.set(code, { sessionId: null, createdAt: now, expiresAt });
  res.json({ code, expiresAt, ttlMs: CODE_TTL_MS });
});

// Bot calls this to link a sessionId to a pair code
// Headers: If PAIRING_SECRET is set, include header 'x-pairing-secret' with that value
// body: { code: string, sessionId: string }
app.post('/link', (req, res) => {
  if (PAIRING_SECRET) {
    const secret = req.header('x-pairing-secret') || '';
    if (!secret || secret !== PAIRING_SECRET) {
      return res.status(401).json({ error: 'invalid pairing secret' });
    }
  }

  const { code, sessionId } = req.body || {};
  if (!code || !sessionId) return res.status(400).json({ error: 'code and sessionId required' });

  const key = code.toUpperCase();
  const info = codes.get(key);
  if (!info) return res.status(404).json({ error: 'code not found or expired' });
  if (info.sessionId) return res.status(409).json({ error: 'code already linked' });

  info.sessionId = String(sessionId);
  codes.set(key, info);
  return res.json({ ok: true, code: key });
});

// Client polls this to see if the code has been claimed
app.get('/status/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase();
  const info = codes.get(code);
  if (!info) return res.status(404).json({ error: 'code not found or expired' });
  return res.json({ code, linked: !!info.sessionId, sessionId: info.sessionId || null, expiresAt: info.expiresAt });
});

app.listen(PORT, () => {
  console.log(`Pairing server listening on port ${PORT}`);
});
