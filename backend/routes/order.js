const express  = require("express");
const router   = express.Router();
const Order    = require("../models/Order");
const Product  = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const { sendReceipt } = require("../services/mailer");

// ── GET ALL ORDERS (staff/admin) ───────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ── GET CURRENT USER'S ORDERS ──────────────────────────────────────
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your orders" });
  }
});

// ── GET SINGLE ORDER ───────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// ── CREATE ORDER ───────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { items, delivery, deliveryMethod, payment, total } = req.body;

    // ── Check stock availability before placing order ──
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Only ${product.stock} units available.`
        });
      }
    }

    // ── Create the order ──
    const order = await Order.create({
      userId: req.user.id,  // ✅ save the logged-in user's ID
      items,
      delivery,
      deliveryMethod: deliveryMethod || "delivery",
      payment: {
        method:   payment.method,
        phone:    payment.phone || "",
        amount:   total,
        status:   "pending",
      },
      total,
      status: "pending",
    });

    // ── Deduct stock for each item ──
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    console.log(`📦 Order ${order._id} created — stock deducted for ${items.length} item(s)`);

    res.status(201).json(order);

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
});

// ── UPDATE ORDER ───────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const update = req.body;
    const prevOrder = await Order.findById(req.params.id);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ── If order is cancelled → restore stock ──
    if (update.status === "cancelled" && prevOrder?.status !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
      console.log(`♻️  Stock restored for cancelled order ${order._id}`);
    }

    // ── Send receipt only when payment manually confirmed as paid ──
    if (update["payment.status"] === "paid") {
      console.log(`💳 Payment confirmed for order ${order._id} — sending receipt`);
      sendReceipt(order).catch(err =>
        console.error("Receipt email error:", err.message)
      );
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order" });
  }
});

// ── MANUALLY RESEND RECEIPT (admin) ───────────────────────────────
router.post("/:id/send-receipt", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.payment?.status !== "paid") {
      return res.status(400).json({
        message: "Receipt can only be sent after payment is confirmed."
      });
    }

    if (order.payment?.method === "stk") {
      return res.status(400).json({
        message: "STK Push receipts are sent automatically on payment confirmation."
      });
    }

    const result = await sendReceipt(order);
    if (result.errors.length > 0) {
      return res.status(207).json({ message: "Receipt sent with some failures", errors: result.errors });
    }
    res.json({ message: "Receipt sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send receipt", error: err.message });
  }
});

// ── DELETE ORDER ───────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete order" });
  }
});

module.exports = router;