const express = require("express");
const router = express.Router();

const Product = require("../models/Product");


// =====================================
// CREATE PRODUCT
// =====================================
router.post("/", async (req, res) => {

  try {

    const product = new Product(req.body);

    await product.save();

    res.status(201).json(product);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// GET ALL PRODUCTS
// =====================================
router.get("/", async (req, res) => {

  try {

    const products = await Product.find();

    res.json(products);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// GET SINGLE PRODUCT
// =====================================
router.get("/:id", async (req, res) => {

  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// UPDATE PRODUCT
// =====================================
router.put("/:id", async (req, res) => {

  try {

    const product =
      await Product.findByIdAndUpdate(

        req.params.id,
        req.body,
        { new: true }

      );

    res.json(product);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// DELETE PRODUCT
// =====================================
router.delete("/:id", async (req, res) => {

  try {

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Product deleted"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


module.exports = router;