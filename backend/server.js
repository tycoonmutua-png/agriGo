const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");
const https    = require("https");
require("dotenv").config();

const app = express();

// ── MIDDLEWARE ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── SERVE STATIC FILES (product images) ───────────────────────────
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ── DATABASE CONNECTION ────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Connection Error:", err.message));

// ── HEALTH CHECK ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🚀 AgriGo API Running Successfully" });
});

// ── ROUTES ─────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/users",    require("./routes/users"));
app.use("/api/products", require("./routes/product"));
app.use("/api/orders",   require("./routes/order"));
app.use("/api/sales",    require("./routes/sale"));
app.use("/api/analytics",require("./routes/analytics"));
app.use("/api/payments", require("./routes/mpesa"));

// ── HANDLE INVALID ROUTES ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── START SERVER ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ── KEEP-ALIVE: ping every 14 min so Render never sleeps ────────
  const BACKEND_URL = process.env.BACKEND_URL || "https://agrigo-backend-ibus.onrender.com";
  setInterval(() => {
    https.get(BACKEND_URL, (res) => {
      console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
    }).on("error", (err) => {
      console.log(`⚠️  Keep-alive failed: ${err.message}`);
    });
  }, 14 * 60 * 1000); // every 14 minutes
});