const express = require("express");
const router  = express.Router();
const {
  registerUser,
  registerStaff,
  loginUser,
  googleAuth,
  facebookAuth,
  getAllStaff,
  approveStaff,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ── Public routes ─────────────────────────────────────────────────
router.post("/register",         registerUser);   // customer register
router.post("/register/staff",   registerStaff);  // staff application
router.post("/login",            loginUser);
router.post("/google",           googleAuth);
router.post("/facebook",         facebookAuth);

// ── Admin only routes ─────────────────────────────────────────────

// GET /api/auth/staff/all  — used by StaffApproval.js
router.get("/staff/all",         protect, getAllStaff);

// GET /api/auth/staff/pending  — used by DashboardLayout badge
router.get("/staff/pending",     protect, async (req, res) => {
  const User = require("../models/User");
  try {
    const pending = await User.find({
      isStaff: true,
      $or: [{ status: "pending" }, { approved: false }],
    }).select("-password");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/staff/:id/status  — used by StaffApproval.js approve/reject buttons
router.patch("/staff/:id/status", protect, async (req, res) => {
  const User = require("../models/User");
  try {
    const { status } = req.body; // "active" | "rejected" | "suspended"
    if (!["active", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, approved: status === "active" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    const label = status === "active" ? "approved" : status;
    res.json({ message: `Staff ${label} successfully.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/staff/:id/approve  — legacy route (kept for compatibility)
router.put("/staff/:id/approve",  protect, approveStaff);

module.exports = router;