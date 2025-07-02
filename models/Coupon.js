const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  image: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  branch_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  }],
  description: {
    type: String,
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  coupon_type: {
    type: String,
    enum: ["custom", "bulk", "seasonal", "event"],
    required: true,
  },
  coupon_code: {
    type: String,
    required: true,
    unique: true,
  },
  discount_type: {
    type: String,
    enum: ["percent", "fixed"],
    required: true,
  },
  discount_amount: {
    type: Number,
    required: true,
  },
  use_limit: {
    type: Number,
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Coupon", CouponSchema);