const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Sale = require("../models/Sale");

router.get("/", async (req, res) => {

  try {

    const totalProducts = await Product.countDocuments();
    const totalSales = await Sale.countDocuments();

    const sales = await Sale.find();

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

    const lowStock = await Product.find({ stock: { $lt: 10 } });

    res.json({
      totalProducts,
      totalSales,
      totalRevenue,
      lowStock
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

module.exports = router;