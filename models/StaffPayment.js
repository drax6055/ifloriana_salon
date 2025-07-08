const mongoose = require("mongoose");

const StaffPaymentSchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
  total_paid: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["cash", "card", "online"],
    required: true,
  },
  description: String,
  paid_at: {
    type: Date,
    default: Date.now,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  tips: {
    type: Number,
    default: 0,
  },
  commission_amount: {  // Add this new field
    type: Number,
    default: 0,
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model("StaffPayment", StaffPaymentSchema);