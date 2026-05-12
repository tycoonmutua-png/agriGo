require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await User.updateMany(
    { $or: [{ password: { $type: "object" } }, { password: null }] },
    { $set: { password: "" } }
  );
  console.log("Fixed:", result.modifiedCount, "accounts");
  process.exit();
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});