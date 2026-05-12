const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, default: "" },

  role: {
    type: String,
    enum: [
      // Customers
      "admin", "customer", "farmer", "buyer", "supplier", "expert",
      // Staff
      "stock_manager", "orders_manager", "sales_agent",
      "cashier", "stock_supervisor",
    ],
    default: "customer",
  },

  phone:      { type: String, default: "" },
  county:     { type: String, default: "" },
  userType:   { type: String, default: "" },   // farmer/buyer/supplier/expert
  department: { type: String, default: "" },   // staff department
  staffId:    { type: String, default: "" },   // e.g. STF-123456
  isStaff:    { type: Boolean, default: false },

  // approved: true  = can log in
  // approved: false = pending or rejected
  approved: { type: Boolean, default: true },

  // status gives more detail
  // "active"    = approved, can log in
  // "pending"   = waiting for admin approval
  // "rejected"  = admin rejected
  // "suspended" = was active but suspended by admin
  status: {
    type: String,
    enum: ["active", "pending", "rejected", "suspended"],
    default: "active",
  },

  avatar:     { type: String, default: "" },
  googleId:   { type: String, default: "" },
  facebookId: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);