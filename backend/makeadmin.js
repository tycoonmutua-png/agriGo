const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.connection.db
    .collection("users")
    .updateOne(
      { email: "admin@agrovet.com" },
      { $set: { role: "admin", status: "active", userType: "admin" } }
    );
  console.log("Updated:", result.modifiedCount, "user");
  process.exit();
});