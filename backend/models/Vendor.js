import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  shopName: {
    type: String,
    required: true,
  },
  location: String,
  approved: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Vendor", vendorSchema);