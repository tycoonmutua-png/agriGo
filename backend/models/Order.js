const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name:     { type: String },
  category: { type: String },
  quantity: { type: Number, required: true },
  price:    { type: Number, required: true },
}, { _id: false });

const DeliverySchema = new mongoose.Schema({
  name:    { type: String },
  phone:   { type: String },
  email:   { type: String },
  county:  { type: String },
  address: { type: String },
  notes:   { type: String },
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  method:            { type: String, enum: ["stk", "manual", "pay_on_pickup"], default: "stk" },
  phone:             { type: String },
  mpesaCode:         { type: String },
  checkoutRequestID: { type: String },
  amount:            { type: Number },
  status:            { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ added
  items:          { type: [OrderItemSchema], required: true },
  delivery:       { type: DeliverySchema },
  deliveryMethod: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  payment:        { type: PaymentSchema },
  total:          { type: Number, required: true },
  status: {
    type:    String,
    enum:    ["pending", "processing", "completed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);