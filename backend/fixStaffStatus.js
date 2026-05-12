// Run this ONCE to fix staff accounts that have no status set
// Usage: node backend/fixStaffStatus.js

require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected to MongoDB");

  // Find all staff with missing/null/empty status
  const STAFF_ROLES = ["stock_manager", "orders_manager", "sales_agent"];

  const result = await User.updateMany(
    {
      role:   { $in: STAFF_ROLES },
      status: { $in: [null, "", undefined] },
    },
    { $set: { status: "pending" } }
  );

  console.log(`✅ Fixed ${result.modifiedCount} staff account(s) — set to "pending"`);

  // Also show all staff and their current status
  const allStaff = await User.find({ role: { $in: STAFF_ROLES } })
    .select("name email role status staffId");

  console.log("\n📋 All staff after fix:");
  allStaff.forEach((s) => {
    console.log(`  ${s.name} | ${s.role} | status: ${s.status} | ${s.staffId}`);
  });

  mongoose.disconnect();
  console.log("\n✅ Done. Restart your backend server.");
}).catch((err) => {
  console.error("❌ DB Error:", err.message);
  process.exit(1);
});