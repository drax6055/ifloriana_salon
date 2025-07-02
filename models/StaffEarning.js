const mongoose = require("mongoose");

const StaffEarningSchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
  staff_name: String,
  payment_method: {
    type: String,
    enum: ["cash", "card", "online"],
    required: true,
  },
  description: String,
  paid_amount: {
    type: Number,
    required: true,
  },
  paid_at: {
    type: Date,
    default: Date.now,
  },
  total_booking: {
    type: Number,
    required: true,
    default: 0,
  },
  service_amount: {
    type: Number,
    required: true,
    default: 0,
  },
  commission_earning: {
    type: Number,
    required: true,
    default: 0,
  },
  tip_earning: {
    type: Number,
    required: true, 
    default: 0, 
  },
  staff_earning: {
    type: Number,
    required: true,
    default: 0, 
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("StaffEarning", StaffEarningSchema);