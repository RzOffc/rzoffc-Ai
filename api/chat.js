import { kv } from '@vercel/kv';

const MILO_API = 'https://api-miloai.vercel.app/api/aijahat';
const MILO_TOKEN = 'MILO-AI-BLACKS3X';
const MAX_HISTORY = 30;

export default async function handler(req, res) {
  // CORS headers — allow web & WhatsApp bot requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET /api/chat?session=xxx  → ambil riwayat ─────────────
  if (req.method === 'GET') {
    const session = req.query.session || 'default';
    try {
      const history = await kv.get(`chat:${session}`) || [];
      return res.status(200).json({ ok: true, session, history });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── POST /api/chat  → kirim pesan ──────────────────────────
  if (req.method === 'POST') {
    const { message, session = 'default' } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'message kosong' });
    }

    try {
      // Ambil riwayat dari KV
      let history = await kv.get(`chat:${session}`) || [];

      // Bangun konteks prompt
      let prompt = message.trim();
      if (history.length > 0) {
        const ctx = history
          .slice(-MAX_HISTORY)
          .map(m => (m.role === 'user' ? `User: ${m.text}` : `AI: ${m.text}`))
          .join('\n');
        prompt = `Berikut riwayat percakapan kita:\n${ctx}\n\nUser: ${message.trim()}\n\nLanjutkan percakapan dengan mengingat konteks di atas.`;
      }

      // Hit Milo-AI API
      const miloRes = await fetch(
        `${MILO_API}?text=${encodeURIComponent(prompt)}&token=${MILO_TOKEN}`
      );
      const miloData = await miloRes.json();

      if (!miloData.status || !miloData.result) {
        return res.status(502).json({ ok: false, error: 'Milo API gagal' });
      }

      const aiReply = miloData.result;

      // Update riwayat & simpan ke KV
      history.push({ role: 'user', text: message.trim(), ts: Date.now() });
      history.push({ role: 'ai', text: aiReply, ts: Date.now() });

      // Batasi panjang history yang disimpan
      if (history.length > MAX_HISTORY * 2) {
        history = history.slice(-MAX_HISTORY * 2);
      }

      await kv.set(`chat:${session}`, history, { ex: 60 * 60 * 24 * 30 }); // 30 hari

      return res.status(200).json({
        ok: true,
        session,
        reply: aiReply,
        history_count: history.length
      });

    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── DELETE /api/chat?session=xxx  → hapus riwayat ──────────
  if (req.method === 'DELETE') {
    const session = req.query.session || 'default';
    try {
      await kv.del(`chat:${session}`);
      return res.status(200).json({ ok: true, message: 'Riwayat dihapus' });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
