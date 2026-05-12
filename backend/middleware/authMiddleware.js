const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── PROTECT ROUTES ──
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB on every request
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ── Block suspended accounts ──
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact the administrator.",
      });
    }

    // ── Block rejected accounts ──
    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Your account application was rejected. Please contact the administrator.",
      });
    }

    // ── Block unapproved/pending staff ──
    if (user.status === "pending" || (user.isStaff && !user.approved)) {
      return res.status(403).json({
        message: "Your staff account is pending admin approval. Please wait for admin to activate your account.",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── ADMIN ONLY ──
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

module.exports = { protect, isAdmin };