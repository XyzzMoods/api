const express = require("express");
const app = express();

// Middleware untuk parsing JSON
app.use(express.json());

// Data sementara
let users = [
  { id: 1, nama: "Budi", umur: 20 },
  { id: 2, nama: "Ani", umur: 22 }
];

// ✅ Endpoint cek API
app.get("/", (req, res) => {
  res.json({ message: "API sederhana berjalan 🚀" });
});

// ✅ Ambil semua user
app.get("/users", (req, res) => {
  res.json(users);
});

// ✅ Ambil user berdasarkan ID
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User tidak ditemukan" });
  }
});

// ✅ Tambah user baru
app.post("/users", (req, res) => {
  const { nama, umur } = req.body;
  const newUser = { id: users.length + 1, nama, umur };
  users.push(newUser);
  res.json({ success: true, data: newUser });
});

// ✅ Export untuk Vercel
module.exports = app;