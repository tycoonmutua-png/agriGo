const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const jwt     = require("jsonwebtoken");
const Product = require("../models/Product");

// ── Inline auth middleware ──────────────────────────────────────────
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ── Multer — saves to backend/public/images ────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../public/images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept jpg, jpeg, png, webp, gif, jfif, jpe
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif", ".jpe"];
  const ext = path.extname(file.originalname).toLowerCase();
  // Also check mimetype for jfif which may come as image/jpeg
  if (allowed.includes(ext) || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── UPLOAD IMAGE ───────────────────────────────────────────────────
router.post("/upload", auth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const imageUrl = `/images/${req.file.filename}`;
    res.json({ imageUrl, message: "Image uploaded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// ── GET ALL PRODUCTS ───────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET SINGLE PRODUCT ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE PRODUCT ─────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE PRODUCT ─────────────────────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE PRODUCT ─────────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete image file if it's a local upload
    if (product.image && product.image.startsWith("/images/")) {
      const filePath = path.join(__dirname, "../public", product.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;