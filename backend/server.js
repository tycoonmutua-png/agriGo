const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ── Serve static files (product images) ──────────────────────────
// Access via: http://localhost:5000/images/filename.jpg
app.use("/images", express.static(path.join(__dirname, "public/images")));

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("❌ DB Connection Error:", err.message));

// HEALTH CHECK ROUTE
app.get("/", (req, res) => {
  res.json({ message: "🚀 AgriGo API Running Successfully" });
});

// ROUTES
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/users",    require("./routes/users"));
app.use("/api/products", require("./routes/product"));
app.use("/api/orders",   require("./routes/order"));
app.use("/api/sales",    require("./routes/sale"));
app.use("/api/analytics",require("./routes/analytics"));
app.use("/api/payments", require("./routes/mpesa"));

// HANDLE INVALID ROUTES
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});