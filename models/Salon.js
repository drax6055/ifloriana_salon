const mongoose = require("mongoose");

const SalonSchema = new mongoose.Schema({
  salon_name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  contact_number: {
    type: String,
    required: false,
  },
  contact_email: {
    type: String,
    required: false,
  },
  opening_time: {
    type: String,
    required: false,
  },
  closing_time: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    enum: ["male", "female", "unisex"],
    required: false,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  package_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdminPackage",
    required: false,
  },
  signup_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("Salon", SalonSchema);
