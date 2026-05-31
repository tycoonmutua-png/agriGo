require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash("Admin1234!", 10);
  await mongoose.connection.db.collection("users").updateOne(
    { email: "admin@agrovet.com" },
    { $set: { password: hash } }
  );
  console.log("Password reset done!");
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });