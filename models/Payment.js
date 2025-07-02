const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  appointment_serial_number: {
    type: String
  },
  service_amount: {
    type: Number,
    default: 0
  },
  product_amount: {
    type: Number,
    default: 0
  },
  sub_total: {
    type: Number,
    default: 0
  },
  coupon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon"
  },
  coupon_discount: {
    type: Number,
    default: 0
  },
  additional_discount: {
    type: Number,
    default: 0
  },
  additional_discount_type: {
    type: String,
    enum: ["percent", "fixed"]
  },
  additional_discount_value: {
    type: Number,
    default: 0
  },
  tax_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tax"
  },
  tax_amount: {
    type: Number,
    default: 0
  },
  tips: {
    type: Number,
    default: 0
  },
  final_total: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);
