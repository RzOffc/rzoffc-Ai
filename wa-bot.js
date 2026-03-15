/**
 * ============================================================
 *  Contoh integrasi Bot WhatsApp dengan RzOffc AI API
 *  Menggunakan library: whatsapp-web.js
 * ============================================================
 * 
 *  Install dulu:
 *    npm install whatsapp-web.js qrcode-terminal axios
 * 
 *  Lalu jalankan:
 *    node wa-bot.js
 * ============================================================
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// ── KONFIGURASI ──────────────────────────────────────────────
const API_URL = 'https://YOUR-DOMAIN.vercel.app/api/whatsapp'; // Ganti dengan domain kamu
const API_KEY  = 'RZOFFC-WA-SECRET';                           // Harus sama dengan WA_API_SECRET di Vercel

// Prefix trigger (bot hanya merespons kalau diawali prefix ini)
// Kosongkan string jika mau bot merespons semua pesan
const PREFIX = '!ai ';

// Nomor yang TIDAK boleh dibalas (opsional)
const BLACKLIST = [];
// ─────────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] }
});

// Tampilkan QR code untuk scan
client.on('qr', qr => {
  console.log('\n📱 Scan QR Code ini dengan WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp siap! Menunggu pesan...');
  console.log(`🔗 API: ${API_URL}`);
  console.log(`🔑 Prefix: "${PREFIX || '(semua pesan)'}"\n`);
});

client.on('message', async msg => {
  const body = msg.body || '';
  const sender = msg.from;   // Format: 6281234567890@c.us
  const isGroup = msg.from.endsWith('@g.us');
  const groupId = isGroup ? msg.from : null;

  // Skip pesan dari diri sendiri
  if (msg.fromMe) return;

  // Skip blacklist
  if (BLACKLIST.some(n => sender.includes(n))) return;

  // Cek prefix
  let userMessage = body;
  if (PREFIX) {
    if (!body.toLowerCase().startsWith(PREFIX.toLowerCase())) return;
    userMessage = body.slice(PREFIX.length).trim();
  }

  if (!userMessage) return;

  console.log(`💬 [${isGroup ? 'GROUP' : 'PRIVATE'}] ${sender}: ${userMessage}`);

  // Indikator "sedang mengetik..."
  const chat = await msg.getChat();
  await chat.sendStateTyping();

  try {
    const response = await axios.post(
      API_URL,
      {
        sender: sender.replace('@c.us', '').replace('@g.us', ''),
        message: userMessage,
        group_id: groupId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        timeout: 30000
      }
    );

    const reply = response.data.reply;
    console.log(`🤖 Bot: ${reply.substring(0, 80)}...`);

    // Kirim balasan
    await msg.reply(reply);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);

    // Kirim pesan error ke user (opsional, bisa dihapus)
    // await msg.reply('Maaf, terjadi kesalahan. Coba lagi ya!');
  } finally {
    await chat.clearState();
  }
});

client.on('auth_failure', () => {
  console.error('❌ Autentikasi gagal. Hapus folder .wwebjs_auth dan scan ulang.');
});

client.on('disconnected', reason => {
  console.log('🔌 Bot terputus:', reason);
});

client.initialize();
