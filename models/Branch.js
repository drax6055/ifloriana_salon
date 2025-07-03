const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  category: {
    type: String,
    enum: ["male", "female", "unisex"],
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  contact_email: {
    type: String,
    required: true,
  },
  contact_number: {
    type: String,
    required: true,
  },
  payment_method: {
    type: [String],
    enum: ["cash", "upi", "razorpay", "stripe"],
    required: true,
  },
  service_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    }
  ],
  address: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postal_code: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  rating_star: {
    type: Number,
    default: 0,
  },
  total_review: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Branch", BranchSchema);