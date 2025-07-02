const mongoose = require("mongoose");

const BranchPackageSchema = new mongoose.Schema({
  branch_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    }
  ],
  package_name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  package_details: [{
    service_id:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    discounted_price:
    {
      type: Number,
      required: true,
    },
    quantity:
    {
      type: Number,
      required: true,
    },
  }],
  package_price: {
    type: Number,
    required: true,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  used_services: [
    {
      service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
      appointment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
      used_at: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("BranchPackage", BranchPackageSchema);