const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// ── GET ALL USERS (admin only) ─────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ── GET ALL STAFF (admin only) ─────────────────────────────────────
router.get("/staff", protect, isAdmin, async (req, res) => {
  try {
    const staff = await User.find({
      role: { $ne: "user" }
    }).select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// ── GET ALL CUSTOMERS (admin only) ────────────────────────────────
router.get("/customers", protect, isAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: { $in: ["customer", "farmer", "buyer", "supplier", "expert"] } })
      .select("-password").sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// ── GET CURRENT USER PROFILE ───────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// ── UPDATE CURRENT USER PROFILE ───────────────────────────────────
router.patch("/me", protect, async (req, res) => {
  try {
    const { name, phone, county } = req.body;
    const updateData = {};
    if (name)   updateData.name   = name;
    if (phone)  updateData.phone  = phone;
    if (county) updateData.county = county;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ── CHANGE CURRENT USER PASSWORD ──────────────────────────────────
router.patch("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password" });
  }
});

// ── GET SINGLE USER ────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// ── UPDATE USER ROLE / STATUS (admin only) ─────────────────────────
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { role, status, name, email, phone } = req.body;
    const updateData = {};
    if (role)   updateData.role   = role;
    if (status) updateData.status = status;
    if (name)   updateData.name   = name;
    if (email)  updateData.email  = email;
    if (phone)  updateData.phone  = phone;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

// ── UPDATE STAFF STATUS (approve/reject/suspend) ───────────────────
router.patch("/:id/status", protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "pending", "suspended", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Status updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// ── DELETE USER (admin only) ───────────────────────────────────────
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;