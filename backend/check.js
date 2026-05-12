require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: "joshua123@gmail.com" });
  console.log("Status:", user.status);
  console.log("Approved:", user.approved);
  console.log("isStaff:", user.isStaff);
  process.exit();
});