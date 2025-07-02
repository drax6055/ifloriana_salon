const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: false,
  },
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    default: undefined,
    set: v => (v === '' ? undefined : v)
  },
  phone_number: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  branch_package: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "BranchPackage",
    required: false,
  }],
  branch_membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BranchMembership",
    required: false,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  branch_package_valid_till: {
    type: Date,
  },

  branch_membership_valid_till: {
    type: Date,
  },

  branch_package_bought_at: {
    type: Date,
  },

  branch_membership_bought_at: {
    type: Date,
  },

}, { timestamps: true });

module.exports = mongoose.model("Customer", CustomerSchema);