const express = require("express");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
const path = require("path");
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

// === API Endpoints ===
app.get("/api/time", (req, res) => {
  res.json({ time: new Date().toLocaleString() });
});

app.get("/api/random", (req, res) => {
  res.json({ number: Math.floor(Math.random() * 100) });
});

const quotes = [
  "Hidup adalah seni menggambar tanpa penghapus.",
  "Jangan tunggu waktu yang tepat, ciptakanlah.",
  "Fokus pada tujuan, bukan hambatan.",
];
app.get("/api/quote", (req, res) => {
  res.json({ quote: quotes[Math.floor(Math.random() * quotes.length)] });
});

app.get("/api/ip", (req, res) => {
  res.json({ ip: req.ip });
});

app.get("/api/hello", (req, res) => {
  const name = req.query.name || "Guest";
  res.json({ message: `Hello, ${name}!` });
});

const jokes = [
  "Kenapa komputer sering ngopi? Karena butuh Java.",
  "Programmer itu kayak tukang sihir, bedanya mereka pakai 'bug' bukan 'sihir'.",
  "HTML itu bukan bahasa pemrograman, tapi bahasa cinta.",
];
app.get("/api/joke", (req, res) => {
  res.json({ joke: jokes[Math.floor(Math.random() * jokes.length)] });
});

app.get("/api/md5", (req, res) => {
  const text = req.query.text;
  if (!text) return res.json({ error: "Masukkan ?text=" });
  res.json({ text, md5: crypto.createHash("md5").update(text).digest("hex") });
});

app.get("/api/base64", (req, res) => {
  if (req.query.encode) {
    return res.json({ original: req.query.encode, base64: Buffer.from(req.query.encode).toString("base64") });
  }
  if (req.query.decode) {
    return res.json({ base64: req.query.decode, decoded: Buffer.from(req.query.decode, "base64").toString("utf-8") });
  }
  res.json({ error: "Gunakan ?encode= atau ?decode=" });
});

app.get("/api/uuid", (req, res) => {
  res.json({ uuid: uuidv4() });
});

app.get("/api/math", (req, res) => {
  const expr = req.query.expr;
  if (!expr) return res.json({ error: "Gunakan ?expr=2+3*4" });
  try {
    res.json({ expr, result: eval(expr) });
  } catch {
    res.json({ error: "Ekspresi tidak valid" });
  }
});

app.get("/api/ytdl", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "Masukkan ?url=link_youtube" });

  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "audioandvideo");
    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails.pop(),
      duration: info.videoDetails.lengthSeconds,
      formats: formats.map((f) => ({
        quality: f.qualityLabel,
        mime: f.mimeType,
        url: f.url,
      })),
    });
  } catch (e) {
    res.json({ error: "Gagal ambil video YouTube." });
  }
});

app.get("/api/tiktok", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "Masukkan ?url=link_tiktok" });

  try {
    const { data } = await axios.get(
      `https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`
    );

    res.json({
      title: data.title,
      author: data.author,
      video_no_watermark: data.video.noWatermark,
      video_watermark: data.video.watermark,
      audio: data.music.play_url,
    });
  } catch (e) {
    res.json({ error: "Gagal ambil video TikTok." });
  }
});

app.get("/api/getsource", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "Masukkan ?url=" });
  try {
    const { data } = await axios.get(url);
    res.json({ url, source: data });
  } catch {
    res.json({ error: "Gagal ambil source." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});