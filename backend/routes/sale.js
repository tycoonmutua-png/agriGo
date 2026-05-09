const express = require("express");
const router = express.Router();

const Sale = require("../models/Sale");
const Product = require("../models/Product");


// =======================
// CREATE SALE
// =======================
router.post("/", async (req, res) => {

  try {

    const { product, quantity } = req.body;

    const item = await Product.findById(product);

    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (item.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    // reduce stock
    item.stock -= quantity;
    await item.save();

    // calculate total
    const total = item.price * quantity;

    // save sale
    const sale = new Sale({
      product,
      quantity,
      total
    });

    await sale.save();

    res.json({
      message: "Sale completed successfully",
      sale
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// =======================
// GET SALES
// =======================
router.get("/", async (req, res) => {

  const sales = await Sale.find().populate("product");

  res.json(sales);

});

module.exports = router;