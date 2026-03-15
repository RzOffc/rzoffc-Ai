# 🔥 RzOffc AI — Deploy Guide

Website chat AI dengan memori permanen + API untuk bot WhatsApp.

---

## 📁 Struktur Project

```
rzoffc-ai/
├── public/
│   └── index.html        ← Frontend website
├── api/
│   ├── chat.js           ← API utama (web chat)
│   └── whatsapp.js       ← API khusus bot WhatsApp
├── wa-bot.js             ← Contoh kode bot WhatsApp
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 LANGKAH DEPLOY KE VERCEL

### Step 1 — Upload ke GitHub
1. Buat akun di https://github.com (jika belum)
2. Klik `+` → **New repository** → beri nama `rzoffc-ai`
3. Upload **semua file** ke repository tersebut

### Step 2 — Buat Vercel KV Database (WAJIB)
1. Login ke https://vercel.com
2. Pergi ke **Storage** → **Create Database** → pilih **KV**
3. Beri nama `rzoffc-kv` → klik **Create**
4. Nanti kamu dapat 3 environment variable otomatis:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Step 3 — Deploy Project
1. Di Vercel dashboard → **Add New Project**
2. **Import** repository `rzoffc-ai` dari GitHub
3. Klik **Deploy**

### Step 4 — Hubungkan KV ke Project
1. Buka project yang sudah di-deploy
2. Pergi ke **Settings** → **Storage**
3. Klik **Connect** pada database `rzoffc-kv`
4. **Redeploy** project (Settings → Deployments → Redeploy)

### Step 5 — Set Environment Variable (untuk WhatsApp API)
1. **Settings** → **Environment Variables**
2. Tambahkan:
   ```
   Name:  WA_API_SECRET
   Value: RZOFFC-WA-SECRET   (ganti dengan password rahasia kamu!)
   ```
3. **Redeploy** lagi

✅ Website kamu sekarang live di `https://rzoffc-ai.vercel.app`!

---

## 🤖 SETUP BOT WHATSAPP

### Di komputer/server kamu:

```bash
# 1. Install dependencies
npm install whatsapp-web.js qrcode-terminal axios

# 2. Edit wa-bot.js — ganti API_URL dengan domain Vercel kamu
# API_URL = 'https://rzoffc-ai.vercel.app/api/whatsapp'
# API_KEY  = 'RZOFFC-WA-SECRET'  ← harus sama dengan WA_API_SECRET di Vercel

# 3. Jalankan bot
node wa-bot.js

# 4. Scan QR code yang muncul dengan WhatsApp kamu
```

### Cara pakai:
- Kirim pesan ke nomor bot: `!ai Halo, siapa kamu?`
- Bot akan membalas menggunakan AI dengan memori percakapan

### Custom prefix:
Ubah `PREFIX = '!ai '` di `wa-bot.js` sesuai keinginan kamu.
Kosongkan (`PREFIX = ''`) jika mau bot balas semua pesan.

---

## 📡 API REFERENCE

### Chat API (untuk web & custom client)

**GET** `/api/chat?session=nama_sesi`
> Ambil riwayat percakapan

**POST** `/api/chat`
```json
{
  "message": "Halo!",
  "session": "user123"
}
```
> Response: `{ "ok": true, "reply": "...", "history_count": 4 }`

**DELETE** `/api/chat?session=nama_sesi`
> Hapus semua riwayat sesi

---

### WhatsApp API

**POST** `/api/whatsapp`
```
Headers:
  Content-Type: application/json
  x-api-key: RZOFFC-WA-SECRET

Body:
{
  "sender": "6281234567890",
  "message": "Halo!",
  "group_id": null
}
```
> Response: `{ "ok": true, "reply": "...", "history_count": 2 }`

---

## 💾 Sistem Memori

- Riwayat disimpan di **Vercel KV** (Redis) — permanen
- Web chat: per **session ID** (bisa diganti di input sesi)
- WhatsApp: per **nomor pengirim** atau **ID grup**
- Data web tersimpan **30 hari**, data WA tersimpan **7 hari**
- Maksimal **30 pesan** yang dibawa sebagai konteks AI

---

Made with ❤️ by RzOffc
