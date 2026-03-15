import { kv } from '@vercel/kv';

/**
 * WhatsApp Bot API Endpoint
 * 
 * Cara pakai dari bot WhatsApp (Node.js / Baileys / Whatsapp-web.js):
 * 
 *   POST https://your-domain.vercel.app/api/whatsapp
 *   Headers: { "Content-Type": "application/json", "x-api-key": "RZOFFC-WA-SECRET" }
 *   Body: { "sender": "6281234567890", "message": "Halo!" }
 * 
 * Response: { "ok": true, "reply": "Balasan AI..." }
 */

const MILO_API = 'https://api-miloai.vercel.app/api/aijahat';
const MILO_TOKEN = 'MILO-AI-BLACKS3X';
const WA_SECRET = process.env.WA_API_SECRET || 'RZOFFC-WA-SECRET';
const MAX_HISTORY = 20;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Hanya POST yang diizinkan' });
  }

  // Cek API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== WA_SECRET) {
    return res.status(401).json({ ok: false, error: 'API key tidak valid' });
  }

  const { sender, message, group_id } = req.body || {};

  if (!sender || !message) {
    return res.status(400).json({ ok: false, error: 'sender dan message wajib diisi' });
  }

  // Session unik per nomor WA (atau per grup)
  const session = `wa:${group_id || sender}`;

  try {
    // Ambil riwayat
    let history = await kv.get(session) || [];

    // Bangun prompt dengan konteks
    let prompt = message.trim();
    if (history.length > 0) {
      const ctx = history
        .slice(-MAX_HISTORY)
        .map(m => (m.role === 'user' ? `User: ${m.text}` : `AI: ${m.text}`))
        .join('\n');
      prompt = `Berikut riwayat percakapan dengan ${sender}:\n${ctx}\n\nUser: ${message.trim()}\n\nBalas dengan mengingat konteks di atas.`;
    }

    // Hit Milo-AI
    const miloRes = await fetch(
      `${MILO_API}?text=${encodeURIComponent(prompt)}&token=${MILO_TOKEN}`
    );
    const miloData = await miloRes.json();

    if (!miloData.status || !miloData.result) {
      return res.status(502).json({ ok: false, error: 'Milo API gagal merespons' });
    }

    const reply = miloData.result;

    // Simpan riwayat
    history.push({ role: 'user', text: message.trim(), sender, ts: Date.now() });
    history.push({ role: 'ai', text: reply, ts: Date.now() });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);

    await kv.set(session, history, { ex: 60 * 60 * 24 * 7 }); // 7 hari

    return res.status(200).json({
      ok: true,
      reply,
      sender,
      session,
      history_count: history.length
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
