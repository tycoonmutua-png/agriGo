const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const axios   = require("axios");

// ── Generate JWT ──────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ── Generate Staff ID ─────────────────────────────────────────────
const generateStaffId = () => {
  const prefix = "AGR";
  const num    = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
};

// ════════════════════════════════════════════
// REGISTER CUSTOMER
// ════════════════════════════════════════════
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, county, userType,
            firstName, lastName, customerType } = req.body;

    // Support both name and firstName/lastName
    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();

    if (!fullName) return res.status(400).json({ message: "Name is required." });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name:     fullName,
      email,
      password:  hashedPassword,
      role:      customerType || role || "customer",
      phone:     phone    || "",
      county:    county   || "",
      userType:  customerType || userType || "",
      approved:  true,
      status:    "active",
      isStaff:   false,
    });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ════════════════════════════════════════════
// REGISTER STAFF (pending admin approval)
// ════════════════════════════════════════════
exports.registerStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, county,
            department, password, staffRole } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "An account with this email already exists." });

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const staffId        = generateStaffId();

    const user = await User.create({
      name:       `${firstName} ${lastName}`.trim(),
      email,
      password:   hashedPassword,
      role:       staffRole || "orders_manager",
      phone:      phone      || "",
      county:     county     || "",
      department: department || "",
      staffId,
      approved:   false,
      status:     "pending",
      isStaff:    true,
    });

    res.status(201).json({
      message: "Staff application submitted successfully. Awaiting admin approval.",
      user: {
        _id:      user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        staffId:  user.staffId,
        approved: user.approved,
        status:   user.status,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ════════════════════════════════════════════
// LOGIN USER
// ════════════════════════════════════════════
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    // ── Block suspended accounts ──
    if (user.status === "suspended") {
      return res.status(401).json({
        message: "⛔ Your account has been suspended. Please contact the administrator.",
      });
    }

    // ── Block rejected accounts ──
    if (user.status === "rejected") {
      return res.status(401).json({
        message: "❌ Your account was rejected. Please contact the administrator.",
      });
    }

    // ── Block pending STAFF only (not customers) ──────────────────
    // Customers are always approved instantly; only staff need admin approval
    if (user.isStaff && (user.status === "pending" || !user.approved)) {
      return res.status(401).json({
        message: "⏳ Your account is pending admin approval. Please check back later.",
      });
    }

    // ── Block Google/Facebook accounts from password login ────────
    if (!user.password || typeof user.password !== "string" || user.password.trim() === "") {
      return res.status(401).json({
        message: "This account was created with Google or Facebook. Please sign in with Google or Facebook instead.",
      });
    }

    // ── Verify password ───────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ════════════════════════════════════════════
// GOOGLE AUTH
// ════════════════════════════════════════════
exports.googleAuth = async (req, res) => {
  try {
    const { access_token } = req.body;

    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email, name, picture } = data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password:  "",
        role:      "customer",
        avatar:    picture || "",
        approved:  true,
        status:    "active",
        isStaff:   false,
        googleId:  data.sub,
      });
    }

    if (user.status === "suspended" || user.status === "rejected") {
      return res.status(401).json({
        message: "⛔ Your account has been suspended. Please contact the administrator.",
      });
    }

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user),
    });

  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// ════════════════════════════════════════════
// FACEBOOK AUTH
// ════════════════════════════════════════════
exports.facebookAuth = async (req, res) => {
  try {
    const { access_token, userID } = req.body;

    const { data } = await axios.get(
      `https://graph.facebook.com/${userID}?fields=id,name,email,picture&access_token=${access_token}`
    );

    const { email, name, picture } = data;

    if (!email) {
      return res.status(400).json({
        message: "Could not get email from Facebook. Please use email registration.",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password:   "",
        role:       "customer",
        avatar:     picture?.data?.url || "",
        approved:   true,
        status:     "active",
        isStaff:    false,
        facebookId: userID,
      });
    }

    if (user.status === "suspended" || user.status === "rejected") {
      return res.status(401).json({
        message: "⛔ Your account has been suspended. Please contact the administrator.",
      });
    }

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user),
    });

  } catch (error) {
    console.error("Facebook auth error:", error.message);
    res.status(500).json({ message: "Facebook authentication failed" });
  }
};

// ════════════════════════════════════════════
// GET ALL STAFF (admin only)
// ════════════════════════════════════════════
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ isStaff: true })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ════════════════════════════════════════════
// APPROVE STAFF (admin only)
// ════════════════════════════════════════════
exports.approveStaff = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true, status: "active" },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Staff member not found" });

    res.json({ message: "Staff account approved successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};