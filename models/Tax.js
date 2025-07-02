const mongoose = require("mongoose");

const TaxSchema = new mongoose.Schema({
  branch_id:[ {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  }],
  title: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["percent", "fixed"],
    required: true,
  },
  tax_type: {
    type: String,
    enum: ["services"],
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
  }
}, { timestamps: true });

module.exports = mongoose.model("Tax", TaxSchema);