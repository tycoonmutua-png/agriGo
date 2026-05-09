import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  description: String,
  location: String,

  isApproved: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });

export default mongoose.model("Shop", shopSchema);